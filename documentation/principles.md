# Principles
If you are making any updates or changes to the codebase, the following principles should be respected.

## App integrity
- Small incremental changes
- Mandatory validation with test
    - Use vitest and not jest
- Always call out risks, dependencies and have mitigation pl;an

## Design & craft
- Extemely important!!
    - Always stick to the global Design system
    - Always use global css variables
    - Always use global common component
    - Avoid inline styles and any local solution
    - UI should always work for Dark and light mode
    - Do not make duplicate components, use variants instead
- Review IA and relevance of the update/chage to IA whenever applicable
- User flows and task flows must be simple and intuitive

## Security & privacy
- Design every achitecture with security & privacy as the foundation

## Performance
- Performance standard should be set and the experience should never go below the benchmark

## Feature compatibility with undo/redo system
- Whenever applicable, always ensure the change/update is compatible with the existing undo/redo system.
- Call out if the undo/redo system needs to be modified to accomodate the new requirements.

## Feature compatibility files storage and serialization
- Whenever applicable, always ensure the change/update is compatible with file storage and serialization.

## Feature compatibility files storage and realtime collaboration
- Whenever applicable, always ensure the change/update is compatible with realtime collaboration.