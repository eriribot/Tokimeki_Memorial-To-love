# Programmatic Evidence Collection

## Use when

Many read-only tool results can be deterministically filtered, joined, sorted, deduplicated, aggregated, or validated into a much smaller review record.

Do not use Programmatic Tool Calling merely because calls are numerous or parallel. Keep direct model/tool calls for semantic judgment, approvals, writes, citations, native artifacts, and final validation.

## Bounded stage

Define before running it:

- eligible read-only tools;
- documented input and output fields;
- exact compact result schema;
- required evidence fields;
- concurrency and retry limits;
- stop condition and handoff to direct judgment.

Recommended result shape:

```json
{
  "changed_files": [],
  "checks": [{ "name": "", "status": "passed|failed|not_run", "evidence": "" }],
  "connection_paths": {
    "generation": "",
    "host_messages": "",
    "plugin_database": "",
    "ui_mirror": ""
  },
  "contradictions": [],
  "missing_evidence": []
}
```

Retry transient failures at most twice. Do not repeat completed calls or perform side effects. A correct program result does not prove the final assistant handoff is complete; validate both.
