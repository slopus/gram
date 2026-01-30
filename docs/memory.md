# Memory plugin

The memory plugin records session updates and supports keyword queries.

- Stored in `.scout/memory/memory.jsonl` (default).
- Each entry includes session id, role, text, and file references.
- Memory can read session logs via the session store API.

```mermaid
flowchart LR
  Sessions[Session updates] --> Memory[Memory plugin]
  Memory --> Search[memory_search tool]
  Memory --> API[GET /v1/engine/memory/search]
```
