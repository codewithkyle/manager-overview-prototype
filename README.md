# Project Manager Overview Prototype

Exploring the concept of creating a web application using an offline-first CRDT based architecture.

## Roadmap

- [x] Create initial UI
- [x] Add task to a team member
    - [x] Locally
    - [x] Globally
- [x] Update task text
    - [x] Locally
    - [x] Globally
- [x] Delete tasks
    - [x] Locally
    - [x] Globally
- [ ] Offline support
    - [x] Add repeating network checking logic
    - [x] Dispatch local changes when network becomes available
    - [ ] Request soft sync when network becomes available
- [ ] Add initial NDJSON ingest logic on fresh start
- [ ] Request soft sync on restart
- [ ] Add hard sync (purge & rebuild datasets)
- [x] Add dataset integrity checks before preforming operations
- [x] Remove `tombstone` keys

## Postmortem

> A few things to note before reading. CRDT is an abbreviation for [Conflict-Free Replicated Data Types](https://crdt.tech/). I will also refer to the individual CRDT operations as opcodes. I noticed a similarity between the role that [opcodes](https://en.wikipedia.org/wiki/Opcode) play within CPU architectures and operation-based CRDTs. I am simply borrowing the terminology.

Pending.