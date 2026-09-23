-- Lets self-directed sessions capture what the learner actually wrote/typed
-- (vocab list, practice sentences, commentary reaction, writing piece), not
-- just a blind completion checkbox. Correction/discussion happens in chat
-- with Claude, not automatically in-app (no LLM backend, per the spec).

alter table session_progress add column response_text text;
