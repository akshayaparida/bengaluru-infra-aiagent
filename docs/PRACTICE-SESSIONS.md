# Practice Sessions - Interview Prep Guide

Structured practice plan to master your project for interviews.

---

## 5-Day Study Plan

### Day 1: Understanding & Architecture (2-3 hours)

**Morning Session (1 hour)**:
1. Read `SYSTEM-ARCHITECTURE-STUDY-GUIDE.md` sections 1-3
2. Take notes on WHY you chose each technology
3. Write down 3 key architectural decisions

**Afternoon Session (1 hour)**:
1. Draw Diagram 1 (High-Level Architecture) 3 times
2. Practice 30-second elevator pitch (Card 51)
3. Review Flashcards 1-15

**Evening Session (30 min)**:
1. Explain architecture to someone (or record yourself)
2. Review any concepts you struggled with

**Homework**:
- Memorize tech stack (14 technologies)
- Be able to explain WHY for each

---

### Day 2: Core Components & Database (2-3 hours)

**Morning Session (1 hour)**:
1. Read study guide sections 4-5
2. Trace code flow for report submission
3. Review database schema in Prisma Studio

**Afternoon Session (1 hour)**:
1. Draw Diagram 4 (Report Submission Flow) 3 times
2. Draw Diagram 8 (Database Schema) 3 times
3. Review Flashcards 11-24

**Evening Session (1 hour)**:
1. Run these commands:
   ```bash
   # View database
   pnpm exec prisma studio
   
   # Check file uploads
   ls -lh .data/uploads/
   
   # Review rate limits
   cat .data/rate-limits.json
   ```
2. Test submitting a report locally
3. Verify database record created

**Homework**:
- Memorize all Report model fields
- Understand EXIF rotation problem & solution

---

### Day 3: Twitter Bot & Rate Limiting (2-3 hours)

**Morning Session (1 hour)**:
1. Read study guide sections 8-9
2. Understand rate limiting algorithm
3. Review Twitter API limits

**Afternoon Session (1 hour)**:
1. Draw Diagram 2 (Twitter Flow) 3 times
2. Draw Diagram 3 (Rate Limiting) 3 times
3. Review Flashcards 19-24, 29-34

**Evening Session (1 hour)**:
1. Read `src/lib/twitter-monitor.ts` line by line
2. Read `src/lib/rate-limit-tracker.ts` line by line
3. Test manually:
   ```bash
   # Check rate limit state
   cat .data/rate-limits.json
   
   # Check processed tweets
   cat .data/processed-tweets.json
   ```

**Homework**:
- Memorize infrastructure keywords by category
- Understand window-based rate limiting

---

### Day 4: Testing & DevOps (2-3 hours)

**Morning Session (1 hour)**:
1. Read study guide sections 10-11
2. Understand testing pyramid
3. Review deployment options

**Afternoon Session (1 hour)**:
1. Draw Diagram 6 (Testing Pyramid)
2. Draw Diagram 7 (AWS Lambda Deployment)
3. Review Flashcards 25-28, 29-34
4. Run tests:
   ```bash
   pnpm test
   pnpm test:ui
   pnpm e2e
   ```

**Evening Session (1 hour)**:
1. Review test files in `tests/` directory
2. Understand the difference:
   - Unit test example
   - Integration test example
   - E2E test example
3. Review deployment docs

**Homework**:
- Memorize 3 deployment options (costs, setup time)
- Understand AWS Lambda architecture

---

### Day 5: Interview Practice & Review (2-3 hours)

**Morning Session (1 hour)**:
1. Review ALL flashcards (60 cards)
2. Focus on cards you got wrong
3. Practice elevator pitch 5 times

**Afternoon Session (1 hour)**:
1. Draw ALL 9 diagrams from memory
2. Time yourself (goal: under 20 minutes total)
3. Review any you struggled with

**Evening Session (1 hour)**:
1. **Mock Interview** (record yourself):
   - Explain project in 30 seconds
   - Draw high-level architecture (2 min)
   - Explain Twitter bot (3 min)
   - Discuss rate limiting (2 min)
   - Describe testing strategy (2 min)
   - Explain deployment (2 min)
2. Watch recording, identify improvements
3. Practice problem areas again

**Before Interview**:
- Review Flashcards: 1, 6, 8, 15, 25, 29, 39, 51, 52, 60
- Quick skim of Cheat Sheet
- Sleep well!

---

## Mock Interview Questions

### Warm-Up Questions (5 minutes)

**Q1**: "Tell me about your Bengaluru Infrastructure project."
- **Practice**: 30-second elevator pitch
- **Key Points**: Problem, solution, tech stack, results

**Q2**: "What technologies did you use and why?"
- **Practice**: List 8+ technologies with WHY
- **Key Points**: Next.js (full-stack), Prisma (type-safe), etc.

**Q3**: "What was the most challenging part?"
- **Practice**: Rate limiting story
- **Key Points**: Twitter API constraints, solution, learning

---

### System Design Questions (20 minutes)

**Q4**: "Draw the architecture of your system."
- **Practice**: Diagram 1 in 2 minutes
- **Talk**: Explain 3-tier architecture, external APIs
- **Follow-up**: "How does a report flow through the system?"

**Q5**: "How does your Twitter bot work?"
- **Practice**: Diagram 2 in 3 minutes
- **Talk**: Cron → Rate limit → Fetch → Classify → Reply
- **Follow-up**: "How do you prevent duplicate processing?"

**Q6**: "Explain your rate limiting implementation."
- **Practice**: Diagram 3 in 1 minute
- **Talk**: Window-based, 15-minute windows, state persistence
- **Follow-up**: "What happens if limits are exceeded?"

**Q7**: "Walk me through submitting a report."
- **Practice**: Diagram 4 in 2 minutes
- **Talk**: Validation → Image processing → Database → Response
- **Follow-up**: "How do you handle photo orientation?"

---

### Technical Deep Dives (15 minutes)

**Q8**: "What's the EXIF rotation problem?"
- **Answer**: Flashcard 3
- **Show**: Code snippet with Sharp
- **Explain**: Mobile cameras, metadata vs pixels

**Q9**: "Why Prisma over raw SQL?"
- **Answer**: Flashcard 2
- **Key Points**: Type safety, migrations, SQL injection prevention

**Q10**: "How do you ensure data consistency?"
- **Answer**: Flashcard 42
- **Key Points**: ACID, optimistic locking, idempotency

**Q11**: "Show me your database schema."
- **Practice**: Diagram 8 in 2 minutes
- **Talk**: Fields, indexes, relationships

---

### Testing & DevOps (10 minutes)

**Q12**: "What's your testing strategy?"
- **Practice**: Diagram 6
- **Answer**: 70% unit, 25% integration, 5% E2E
- **Show**: Test coverage targets

**Q13**: "How would you deploy this to production?"
- **Practice**: Diagram 7
- **Compare**: Lambda vs Vercel vs EC2
- **Recommend**: Lambda ($1-5/mo, serverless)

**Q14**: "How do you handle errors in production?"
- **Answer**: Graceful degradation, fallbacks, monitoring
- **Example**: AI fails → keyword classification

---

### Scaling & Architecture (10 minutes)

**Q15**: "How would you scale to 10,000 reports/day?"
- **Answer**: Flashcard 39
- **Points**: Read replicas, S3+CDN, Redis, queues, load balancer

**Q16**: "How would you handle Twitter API downtime?"
- **Answer**: Flashcard 41
- **Points**: Circuit breaker, queue, dead letter queue, alerts

**Q17**: "What improvements would you make?"
- **Answer**: Flashcard 54
- **Points**: Event-driven, microservices, GraphQL, real-time

---

### Behavioral Questions (5 minutes)

**Q18**: "Why did you build this project?"
- **Answer**: Problem in Bengaluru, learn full-stack, hackathon tech

**Q19**: "What did you learn?"
- **Answer**: Rate limiting, production constraints, TDD, DevOps

**Q20**: "What would you do differently?"
- **Answer**: Earlier testing, better error handling, more monitoring

---

## Practice Exercises

### Exercise 1: Code Walkthrough (30 minutes)

Pick a feature and trace the entire code flow:

**Example: Report Submission**
1. Frontend: `src/app/report/ReportForm.tsx`
   - State management
   - Form validation
   - GPS capture
   - Photo upload
   
2. API: `src/app/api/reports/route.ts`
   - Zod validation
   - Sharp processing
   - Prisma create
   
3. Database: `prisma/schema.prisma`
   - Report model
   - Field types
   - Indexes

**Practice**: Explain this flow out loud as if teaching someone

---

### Exercise 2: Debugging Scenario (15 minutes)

**Scenario**: "Photos are appearing sideways on the dashboard."

**Your Response**:
1. **Identify**: EXIF rotation issue
2. **Root Cause**: Mobile cameras save orientation metadata
3. **Solution**: Use Sharp's `.rotate()` to physically rotate pixels
4. **Code**:
   ```typescript
   await sharp(buffer)
     .rotate()  // Auto-rotates based on EXIF
     .jpeg({ quality: 90 })
     .toFile(outputPath);
   ```
5. **Prevention**: Always process uploads with Sharp

**Practice**: Explain this calmly and confidently

---

### Exercise 3: Feature Addition (20 minutes)

**Scenario**: "How would you add SMS notifications?"

**Your Response**:
1. **Service**: Use Twilio API
2. **Data Model**: Add `phoneNumber` field to Report
3. **API Route**: `POST /api/reports/:id/notify-sms`
4. **Logic**:
   ```typescript
   async function sendSMS(report: Report) {
     const message = `Your report ${report.id} has been classified as ${report.category}. Status: ${report.status}`;
     await twilioClient.messages.create({
       to: report.phoneNumber,
       from: TWILIO_NUMBER,
       body: message
     });
   }
   ```
5. **Testing**: Unit test for SMS formatting, integration test with Twilio sandbox
6. **Feature Flag**: `ENABLE_SMS=true`

**Practice**: Design features confidently with rationale

---

### Exercise 4: Performance Analysis (15 minutes)

**Scenario**: "Dashboard is slow loading 1000+ reports."

**Your Response**:
1. **Identify Bottleneck**: Database query, no pagination
2. **Solutions**:
   - **Pagination**: `skip` and `take` in Prisma
   - **Caching**: Redis cache for recent reports (5 min TTL)
   - **Indexing**: Add composite index on `(createdAt, status)`
   - **Lazy Loading**: Load markers as user scrolls map
   - **Query Optimization**: Select only needed fields
   
3. **Implementation**:
   ```typescript
   const reports = await prisma.report.findMany({
     skip: page * pageSize,
     take: pageSize,
     orderBy: { createdAt: 'desc' },
     select: { id: true, lat: true, lng: true, category: true }
   });
   ```

**Practice**: Think about performance proactively

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Not Explaining WHY
**Bad**: "I used Next.js."
**Good**: "I used Next.js because it's a full-stack framework with file-based routing, which allows me to build both frontend and backend in one codebase with great developer experience."

### ❌ Mistake 2: Over-Engineering
**Bad**: "I would use Kafka, Kubernetes, and GraphQL federation."
**Good**: "For this scale, a simple queue like Bull with Redis is sufficient. Kafka would be overkill."

### ❌ Mistake 3: Not Mentioning Trade-offs
**Bad**: "Lambda is the best option."
**Good**: "Lambda is great for low traffic because it's cheap ($1-5/mo) and serverless, but has cold starts and 15-min timeout. For always-on services, EC2 might be better."

### ❌ Mistake 4: Ignoring Production Concerns
**Bad**: Just talk about features.
**Good**: "I implemented rate limiting to respect API constraints, added comprehensive error handling with fallbacks, and ensured 85%+ test coverage for production confidence."

### ❌ Mistake 5: Can't Draw Architecture
**Bad**: Struggle to draw, fumble, give up.
**Good**: Practice until you can draw the high-level architecture in under 2 minutes while explaining it.

---

## Interview Day Checklist

### 1 Week Before:
- [ ] Complete 5-day study plan
- [ ] Practice all flashcards
- [ ] Draw all diagrams from memory
- [ ] Record mock interview

### 3 Days Before:
- [ ] Review flashcards: 1, 6, 8, 15, 25, 29, 39, 51, 52, 60
- [ ] Practice elevator pitch 10 times
- [ ] Re-read cheat sheet

### 1 Day Before:
- [ ] Light review (don't cram)
- [ ] Skim architecture diagrams
- [ ] Prepare questions to ask interviewer
- [ ] Get 8 hours sleep

### Interview Day:
- [ ] Review cheat sheet (15 min)
- [ ] Practice elevator pitch 3 times
- [ ] Bring laptop with project running (if allowed)
- [ ] Be confident!

---

## After Interview

### Immediate (within 1 hour):
1. Write down questions you were asked
2. Note what you answered well
3. Note what you struggled with
4. Add to this practice guide

### Follow-up (same day):
1. Send thank-you email
2. If you promised code samples, send them
3. Review any topics you need to improve

### Continuous Improvement:
1. Update flashcards with new questions
2. Practice weak areas
3. Share learnings with others

---

## Resources Checklist

Before interviews, have these ready:

**Documentation**:
- [ ] `/docs/SYSTEM-ARCHITECTURE-STUDY-GUIDE.md` (full reference)
- [ ] `/docs/CHEAT-SHEET.md` (quick review)
- [ ] `/docs/FLASHCARDS.md` (60 practice questions)
- [ ] `/docs/DIAGRAMS-TEMPLATES.md` (whiteboard practice)
- [ ] `/docs/PRACTICE-SESSIONS.md` (this file)

**Live Demo**:
- [ ] Project running on `localhost:3000`
- [ ] Docker services up (`docker compose up -d`)
- [ ] Sample reports in database
- [ ] Mailpit showing emails (`localhost:8025`)
- [ ] Test suite passing (`pnpm test`)

**Portfolio**:
- [ ] GitHub repo clean and documented
- [ ] README.md clear and concise
- [ ] Production deployment (Vercel/AWS) working
- [ ] Screenshots in `/screenshots/` directory

---

## Confidence Builders

### You Know This Project Because:
✅ You built it from scratch
✅ You made all architectural decisions
✅ You solved real problems (rate limiting, EXIF)
✅ You have 85%+ test coverage
✅ You can deploy it to production
✅ You've documented everything

### During Interview, Remember:
1. **Breathe**: Take a pause before answering
2. **Clarify**: Ask questions if unclear
3. **Structure**: Use frameworks (3-tier architecture, testing pyramid)
4. **Honesty**: Admit what you don't know, then explain how you'd learn
5. **Enthusiasm**: Show passion for building things

---

## Success Metrics

After completing this practice plan, you should be able to:

- [ ] Explain your project in 30 seconds
- [ ] Draw high-level architecture in 2 minutes
- [ ] List 10+ technologies with WHY
- [ ] Describe Twitter bot flow in detail
- [ ] Explain rate limiting algorithm
- [ ] Discuss 3 deployment options with trade-offs
- [ ] Answer "how to scale to 10K reports/day"
- [ ] Trace code flow for any feature
- [ ] Design new features on the spot
- [ ] Confidently discuss production concerns

---

**Remember**: You built this. You understand it. You can explain it. Good luck! 🚀

**Time Investment**: 10-15 hours of focused practice
**Payoff**: Confidence in technical interviews, job offers, learning
