# Routes structure

```
src/routes/
  index.tsx, login.tsx, register.tsx
  api/auth/, api/data/
  dashboard/
    route.tsx          # layout + AuthGate
    index.tsx          # home by role
    child/             # learning pages (child only)
    parent/            # parent monitor + kelola anak
    teacher/           # teacher tools
    therapist/         # therapist tools
    shared/            # community + settings (all roles)
```

UI logic lives in `src/features/{role}/`. Route files are thin wrappers only.
