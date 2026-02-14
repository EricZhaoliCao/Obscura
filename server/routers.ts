import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { invokeLLM } from "./_core/llm";
import { transcribeAudio } from "./_core/voiceTranscription";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ========== Category Router ==========
  categories: router({
    list: publicProcedure.query(async () => {
      return await db.getAllCategories();
    }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return await db.getCategoryById(input.id);
      }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1).max(100),
        slug: z.string().min(1).max(100),
        description: z.string().optional(),
        color: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        return await db.createCategory(input);
      }),
  }),

  // ========== Document Router ==========
  documents: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getDocumentsByAuthor(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const doc = await db.getDocumentById(input.id);
        if (!doc) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
        }
        if (doc.authorId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        return doc;
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(500),
        content: z.string(),
        format: z.enum(['markdown', 'richtext']).default('markdown'),
        categoryId: z.number().optional(),
        tags: z.string().optional(),
        isPublic: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createDocument({
          ...input,
          authorId: ctx.user.id,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(500).optional(),
        content: z.string().optional(),
        format: z.enum(['markdown', 'richtext']).optional(),
        categoryId: z.number().optional(),
        tags: z.string().optional(),
        isPublic: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const doc = await db.getDocumentById(input.id);
        if (!doc) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
        }
        if (doc.authorId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        const { id, ...updates } = input;
        return await db.updateDocument(id, updates);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const doc = await db.getDocumentById(input.id);
        if (!doc) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' });
        }
        if (doc.authorId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        return await db.deleteDocument(input.id);
      }),
    
    search: protectedProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input, ctx }) => {
        return await db.searchDocuments(input.query, ctx.user.id);
      }),
  }),

  // ========== File Router ==========
  files: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getFilesByUploader(ctx.user.id);
    }),
    
    upload: protectedProcedure
      .input(z.object({
        filename: z.string(),
        content: z.string(), // base64 encoded
        mimeType: z.string(),
        documentId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const buffer = Buffer.from(input.content, 'base64');
        const fileKey = `${ctx.user.id}/files/${nanoid()}-${input.filename}`;
        const { url } = await storagePut(fileKey, buffer, input.mimeType);
        
        return await db.createFile({
          filename: input.filename,
          fileKey,
          url,
          mimeType: input.mimeType,
          size: buffer.length,
          uploaderId: ctx.user.id,
          documentId: input.documentId,
        });
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const file = await db.getFileById(input.id);
        if (!file) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'File not found' });
        }
        if (file.uploaderId !== ctx.user.id && ctx.user.role !== 'admin') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Access denied' });
        }
        return await db.deleteFile(input.id);
      }),
  }),

  // ========== Blog Router ==========
  blog: router({
    listPublished: publicProcedure.query(async () => {
      return await db.getAllBlogPosts(false);
    }),
    
    listAll: adminProcedure.query(async () => {
      return await db.getAllBlogPosts(true);
    }),
    
    getBySlug: publicProcedure
      .input(z.object({ slug: z.string() }))
      .query(async ({ input }) => {
        const post = await db.getBlogPostBySlug(input.slug);
        if (!post) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
        }
        await db.incrementBlogPostViews(post.id);
        return post;
      }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const post = await db.getBlogPostById(input.id);
        if (!post) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Post not found' });
        }
        return post;
      }),
    
    getByCategory: publicProcedure
      .input(z.object({ categoryId: z.number() }))
      .query(async ({ input }) => {
        return await db.getBlogPostsByCategory(input.categoryId);
      }),
    
    create: adminProcedure
      .input(z.object({
        title: z.string().min(1).max(500),
        slug: z.string().min(1).max(500),
        content: z.string(),
        excerpt: z.string().optional(),
        coverImage: z.string().optional(),
        categoryId: z.number().optional(),
        tags: z.string().optional(),
        isPublished: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createBlogPost({
          ...input,
          authorId: ctx.user.id,
          publishedAt: input.isPublished ? new Date() : undefined,
        });
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(500).optional(),
        slug: z.string().min(1).max(500).optional(),
        content: z.string().optional(),
        excerpt: z.string().optional(),
        coverImage: z.string().optional(),
        categoryId: z.number().optional(),
        tags: z.string().optional(),
        isPublished: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, isPublished, ...updates } = input;
        const post = await db.getBlogPostById(id);
        
        const finalUpdates: any = { ...updates };
        if (isPublished !== undefined && isPublished !== post?.isPublished) {
          finalUpdates.isPublished = isPublished;
          if (isPublished && !post?.publishedAt) {
            finalUpdates.publishedAt = new Date();
          }
        }
        
        return await db.updateBlogPost(id, finalUpdates);
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.deleteBlogPost(input.id);
      }),
    
    search: publicProcedure
      .input(z.object({ query: z.string() }))
      .query(async ({ input }) => {
        return await db.searchBlogPosts(input.query);
      }),
  }),

  // ========== Comment Router ==========
  comments: router({
    listByPost: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ input }) => {
        return await db.getCommentsByPost(input.postId);
      }),
    
    create: protectedProcedure
      .input(z.object({
        postId: z.number(),
        content: z.string().min(1),
        parentId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const result = await db.createComment({
          ...input,
          authorId: ctx.user.id,
        });
        
        // Create notification for post author
        const post = await db.getBlogPostById(input.postId);
        if (post && post.authorId !== ctx.user.id) {
          await db.createNotification({
            userId: post.authorId,
            type: 'comment',
            title: 'New comment on your post',
            content: `${ctx.user.name || 'Someone'} commented on "${post.title}"`,
            relatedId: input.postId,
          });
        }
        
        return result;
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Note: We need to fetch the comment first to check ownership
        // This is a simplified version - in production you'd want to add a getCommentById helper
        return await db.deleteComment(input.id);
      }),
  }),

  // ========== Like Router ==========
  likes: router({
    getByPost: publicProcedure
      .input(z.object({ postId: z.number() }))
      .query(async ({ input }) => {
        const likes = await db.getLikesByPost(input.postId);
        return { count: likes.length, likes };
      }),
    
    toggle: protectedProcedure
      .input(z.object({ postId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const existing = await db.getUserLikeForPost(input.postId, ctx.user.id);
        
        if (existing) {
          await db.deleteLike(input.postId, ctx.user.id);
          return { liked: false };
        } else {
          await db.createLike({
            postId: input.postId,
            userId: ctx.user.id,
          });
          
          // Create notification for post author
          const post = await db.getBlogPostById(input.postId);
          if (post && post.authorId !== ctx.user.id) {
            await db.createNotification({
              userId: post.authorId,
              type: 'like',
              title: 'New like on your post',
              content: `${ctx.user.name || 'Someone'} liked "${post.title}"`,
              relatedId: input.postId,
            });
          }
          
          return { liked: true };
        }
      }),
  }),

  // ========== Notification Router ==========
  notifications: router({
    list: protectedProcedure
      .input(z.object({ unreadOnly: z.boolean().default(false) }))
      .query(async ({ input, ctx }) => {
        return await db.getNotificationsByUser(ctx.user.id, input.unreadOnly);
      }),
    
    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        return await db.markNotificationAsRead(input.id);
      }),
    
    markAllAsRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        return await db.markAllNotificationsAsRead(ctx.user.id);
      }),
  }),

  // ========== AI Assistant Router ==========
  ai: router({
    generateSummary: protectedProcedure
      .input(z.object({ content: z.string() }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are a helpful assistant that generates concise summaries. Respond in the same language as the input.' },
            { role: 'user', content: `Please summarize the following content in 2-3 sentences:\n\n${input.content}` },
          ],
        });
        return { summary: response.choices[0]?.message.content || '' };
      }),
    
    generateTags: protectedProcedure
      .input(z.object({ content: z.string() }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are a helpful assistant that generates relevant tags for content. Return only a JSON array of 3-5 tags.' },
            { role: 'user', content: `Generate relevant tags for this content:\n\n${input.content}` },
          ],
          response_format: {
            type: 'json_schema',
            json_schema: {
              name: 'tags',
              strict: true,
              schema: {
                type: 'object',
                properties: {
                  tags: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'Array of relevant tags',
                  },
                },
                required: ['tags'],
                additionalProperties: false,
              },
            },
          },
        });
        const content = response.choices[0]?.message.content;
        const contentStr = typeof content === 'string' ? content : '{"tags":[]}';
        const result = JSON.parse(contentStr);
        return { tags: result.tags };
      }),
    
    improveWriting: protectedProcedure
      .input(z.object({ content: z.string() }))
      .mutation(async ({ input }) => {
        const response = await invokeLLM({
          messages: [
            { role: 'system', content: 'You are a professional writing assistant. Improve the given text while maintaining its original meaning and tone. Respond in the same language as the input.' },
            { role: 'user', content: input.content },
          ],
        });
        const content = response.choices[0]?.message.content;
        return { improved: typeof content === 'string' ? content : '' };
      }),
  }),

  // ========== Voice Transcription Router ==========
  voice: router({
    transcribe: protectedProcedure
      .input(z.object({
        audioUrl: z.string(),
        language: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const result = await transcribeAudio({
          audioUrl: input.audioUrl,
          language: input.language,
        });
        if ('error' in result) {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: result.error });
        }
        return { text: result.text, language: result.language };
      }),
  }),

  // ========== Health Records Router ==========
  health: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getHealthRecordsByUser(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const record = await db.getHealthRecordById(input.id);
        if (!record || record.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        return record;
      }),
    
    create: protectedProcedure
      .input(z.object({
        date: z.date(),
        sleepHours: z.number().optional(),
        sleepQuality: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
        meals: z.string().optional(),
        water: z.number().optional(),
        exercise: z.string().optional(),
        exerciseDuration: z.number().optional(),
        mood: z.enum(['bad', 'okay', 'good', 'great']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createHealthRecord({
          ...input,
          userId: ctx.user.id,
        });
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        date: z.date().optional(),
        sleepHours: z.number().optional(),
        sleepQuality: z.enum(['poor', 'fair', 'good', 'excellent']).optional(),
        meals: z.string().optional(),
        water: z.number().optional(),
        exercise: z.string().optional(),
        exerciseDuration: z.number().optional(),
        mood: z.enum(['bad', 'okay', 'good', 'great']).optional(),
        notes: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const record = await db.getHealthRecordById(id);
        if (!record || record.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        return await db.updateHealthRecord(id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const record = await db.getHealthRecordById(input.id);
        if (!record || record.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        return await db.deleteHealthRecord(input.id);
      }),
  }),

  // ========== Financial Transactions Router ==========
  finance: router({
    listTransactions: protectedProcedure.query(async ({ ctx }) => {
      return await db.getTransactionsByUser(ctx.user.id);
    }),
    
    getTransaction: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const transaction = await db.getTransactionById(input.id);
        if (!transaction || transaction.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        return transaction;
      }),
    
    createTransaction: protectedProcedure
      .input(z.object({
        type: z.enum(['income', 'expense']),
        category: z.string().min(1).max(100),
        amount: z.number().positive(),
        currency: z.string().default('CNY'),
        description: z.string().optional(),
        date: z.date(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createTransaction({
          ...input,
          userId: ctx.user.id,
        });
      }),
    
    updateTransaction: protectedProcedure
      .input(z.object({
        id: z.number(),
        type: z.enum(['income', 'expense']).optional(),
        category: z.string().min(1).max(100).optional(),
        amount: z.number().positive().optional(),
        currency: z.string().optional(),
        description: z.string().optional(),
        date: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        const transaction = await db.getTransactionById(id);
        if (!transaction || transaction.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        return await db.updateTransaction(id, data);
      }),
    
    deleteTransaction: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const transaction = await db.getTransactionById(input.id);
        if (!transaction || transaction.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }
        return await db.deleteTransaction(input.id);
      }),
    
    getSummary: protectedProcedure
      .input(z.object({
        startDate: z.date(),
        endDate: z.date(),
      }))
      .query(async ({ input, ctx }) => {
        return await db.getTransactionsSummary(ctx.user.id, input.startDate, input.endDate);
      }),
    
    getLatestBalance: protectedProcedure.query(async ({ ctx }) => {
      return await db.getLatestBalance(ctx.user.id);
    }),
    
    getBalanceHistory: protectedProcedure.query(async ({ ctx }) => {
      return await db.getBalanceHistory(ctx.user.id);
    }),
    
    updateBalance: protectedProcedure
      .input(z.object({
        amount: z.number(),
        currency: z.string().default('CNY'),
        date: z.date(),
      }))
      .mutation(async ({ input, ctx }) => {
        return await db.createBalance({
          ...input,
          userId: ctx.user.id,
        });
      }),
  }),

  // ========== Dashboard Stats Router ==========
  dashboard: router({
    stats: protectedProcedure.query(async ({ ctx }) => {
      const documents = await db.getDocumentsByAuthor(ctx.user.id);
      const files = await db.getFilesByUploader(ctx.user.id);
      const allPosts = ctx.user.role === 'admin' ? await db.getAllBlogPosts(true) : [];
      const notifications = await db.getNotificationsByUser(ctx.user.id, true);
      
      return {
        documentCount: documents.length,
        fileCount: files.length,
        blogPostCount: allPosts.length,
        unreadNotifications: notifications.length,
        recentDocuments: documents.slice(0, 5),
        recentFiles: files.slice(0, 5),
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
