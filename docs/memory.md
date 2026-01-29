# Memory engine

The memory engine records session updates and supports keyword queries.

- Stored in `.scout/memory/memory.jsonl`.
- Each entry includes session id, role, text, and file references.
- Memory can read session logs via the session store API.

```mermaid
flowchart LR
  Sessions[Session updates] --> Memory[MemoryEngine]
  Memory --> Search[memory_search tool]
  Memory --> API[GET /v1/engine/memory/search]
  Memory --> SessionsAPI[SessionStore read entries]
```
