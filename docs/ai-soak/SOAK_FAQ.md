# SOAK FAQ

**Q: What is the goal of the soak?**  
A: To validate in real use that the new central prompt path (`buildPrompt` + `generateWithCentralPrompt`) is stable, widely adopted, and safe before we deprecate the old delegation methods.

**Q: How do I monitor?**  
A: Best way is the live panel in AIDevToolsPanel (AI Beta mode). Alternative: console `AIBrain.getUsageStats()`.

**Q: How often should I check?**  
A: Once a day is ideal. Every 2-3 days is fine if busy.

**Q: Where do I record what I see?**  
A: `docs/ai-soak/SOAK_LOG_2026-07-27.md`

**Q: What are we waiting for to end the soak?**  
A: See `SOAK_SUCCESS_DEFINITION.md` and `SOAK_EXIT_CRITERIA.md`.

**Q: What if I see a problem?**  
A: Note it in the log + ping the team. Do not ignore red flags (high fallback, sudden drop in usage, new errors).

**Q: Can I still use the old methods?**  
A: Yes — they are kept for rollback safety inside AIBrain. New code should prefer the central path.
