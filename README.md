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
- [x] Offline support
    - [x] Add repeating network checking logic
    - [x] Dispatch local changes when network becomes available
    - [x] Soft sync when network becomes available
    - [x] Request soft sync on restart
    - [x] Add etag key to opcode
- [x] Dataset integrity checks before preforming operations
- [x] Run a batch process every 10000 operations to normalize the NDJSON file
- [x] Log the normalize timestamp and block any request made before the normalization
- [x] Refactor ledger for faster resyncs
    - [x] Ledger holds operations in the order in which they arrive
    - [x] Clients hold the last recieved operation id in `localStorage`
    - [x] Add an endpoint that accepts an operation id & returns an array of (future) operations or `404` when users last op was before the last normalization process

## Postmortem

> A few things to note before reading. CRDT is an abbreviation for [Conflict-Free Replicated Data Types](https://crdt.tech/). I will also refer to the individual CRDT operations as opcodes. I noticed a similarity between the role that [opcodes](https://en.wikipedia.org/wiki/Opcode) play within CPU architectures and operation-based CRDTs. I am simply borrowing the terminology.

Pending.