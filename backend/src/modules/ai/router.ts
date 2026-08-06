import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { strictLimiter } from '../../middlewares/rateLimit.js';
import {
  analyzeJobSchema,
  draftReplySchema,
  interviewPrepSchema,
  rewriteSchema,
  summarizeSchema,
} from './schema.js';
import { AiService } from './service.js';
import { AiController } from './controller.js';
import { ConversationRepository } from '../conversations/repository.js';
import { MessageRepository } from '../messages/repository.js';
import { JobRepository } from '../jobs/repository.js';
import { InterviewRepository } from '../interviews/repository.js';
import { ProfileRepository } from '../users/repository.js';

const conversations = new ConversationRepository();
const messages = new MessageRepository();
const jobs = new JobRepository();
const interviews = new InterviewRepository();
const profiles = new ProfileRepository();

const service = new AiService({
  getConversation: (userId, id) => conversations.findById(userId, id),
  getLastMessages: async (userId, conversationId, n) => {
    const conversation = await conversations.findById(userId, conversationId);
    if (!conversation) return [];
    return messages.lastN(conversationId, n);
  },
  getJob: (userId, id) => jobs.findAiView(userId, id),
  updateJobAnalysis: (userId, id, fitScore, analysis) => jobs.updateAnalysis(userId, id, fitScore, analysis),
  getInterview: (userId, id) => interviews.findAiView(userId, id),
  updateInterviewPrep: (userId, id, prep) => interviews.updatePrep(userId, id, prep),
  getProfile: (userId) => profiles.findContext(userId),
});

const controller = new AiController(service);
const router = Router();

router.use(requireAuth, strictLimiter);

router.post('/draft-reply', validate({ body: draftReplySchema }), controller.draftReply);
router.post('/rewrite', validate({ body: rewriteSchema }), controller.rewrite);
router.post('/analyze-job', validate({ body: analyzeJobSchema }), controller.analyzeJob);
router.post('/interview-prep', validate({ body: interviewPrepSchema }), controller.interviewPrep);
router.post('/summarize', validate({ body: summarizeSchema }), controller.summarize);

export const aiRouter = router;
