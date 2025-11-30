# /speckit.spec

Create or update specifications.

## Usage

```
/speckit.spec <spec-name> [content]
```

## Description

The `/speckit.spec` command allows you to create or update project specifications. Specifications help document requirements and constraints for the implementation.

## Parameters

- `<spec-name>` - The name of the specification (required)
- `[content]` - The content or description of the specification (optional)

## Examples

```
/speckit.spec user-authentication
/speckit.spec user-authentication "User authentication should support email and password login"
```

## Best Practices

- Create clear, executable specifications
- Break down complex features into smaller specs
- Ensure each spec is testable and verifiable
- Document any assumptions or constraints
- Keep specifications up to date as you implement

