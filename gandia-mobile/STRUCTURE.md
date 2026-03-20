# Project Structure

```
├── .env
├── .env.example
├── .gitignore
├── app
│   ├── (app)
│   │   ├── ayuda.tsx
│   │   ├── cfg-accesibilidad.tsx
│   │   ├── cfg-apariencia.tsx
│   │   ├── cfg-asistente.tsx
│   │   ├── cfg-notificaciones.tsx
│   │   ├── cfg-seguridad.tsx
│   │   ├── chat.tsx
│   │   ├── configuraciones.tsx
│   │   ├── historial.tsx
│   │   ├── InstitucionalPerfil
│   │   │   ├── Auditor
│   │   │   │   ├── editar.tsx
│   │   │   │   └── index.tsx
│   │   │   ├── Exportador
│   │   │   │   ├── editar.tsx
│   │   │   │   └── index.tsx
│   │   │   ├── MVZ
│   │   │   │   ├── editar.tsx
│   │   │   │   └── index.tsx
│   │   │   ├── Rancho
│   │   │   │   ├── editar.tsx
│   │   │   │   └── index.tsx
│   │   │   └── UG
│   │   │       ├── editar.tsx
│   │   │       └── index.tsx
│   │   ├── noticias
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   ├── notificaciones.tsx
│   │   ├── perfil
│   │   │   ├── editar.tsx
│   │   │   ├── index.tsx
│   │   │   └── PerfilRouter.tsx
│   │   ├── plan.tsx
│   │   ├── tramites
│   │   │   ├── index.tsx
│   │   │   └── panel.tsx
│   │   ├── voz.tsx
│   │   └── _layout.tsx
│   ├── (public)
│   │   ├── login.tsx
│   │   ├── signup
│   │   │   ├── confirmation.tsx
│   │   │   ├── index.tsx
│   │   │   ├── institutional.tsx
│   │   │   └── personal.tsx
│   │   ├── splash.tsx
│   │   └── _layout.tsx
│   ├── index.tsx
│   ├── onboarding.tsx
│   └── _layout.tsx
├── app.json
├── App.tsx
├── assets
│   ├── android-icon-background.png
│   ├── android-icon-foreground.png
│   ├── android-icon-monochrome.png
│   ├── favicon.png
│   ├── fonts
│   │   ├── .gitkeep
│   │   ├── Geist-Medium.ttf
│   │   ├── Geist-Regular.ttf
│   │   ├── Geist-SemiBold.ttf
│   │   └── InstrumentSerif-Italic.ttf
│   ├── icon.png
│   ├── icons
│   │   └── .gitkeep
│   ├── images
│   │   └── .gitkeep
│   └── splash-icon.png
├── index.ts
├── package.json
├── project-structure.cjs
├── src
│   ├── components
│   │   ├── auth
│   │   │   ├── AuthGuard.tsx
│   │   │   └── RoleGuard.tsx
│   │   ├── chat
│   │   │   ├── ArtifactCard.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── MessageBubble.tsx
│   │   │   └── MessageList.tsx
│   │   ├── layout
│   │   │   ├── AppHeader.tsx
│   │   │   ├── BottomTabs.tsx
│   │   │   └── ScreenWrapper.tsx
│   │   ├── notificaciones
│   │   │   ├── NotifItem.tsx
│   │   │   └── NotifPanel.tsx
│   │   ├── tramites
│   │   │   ├── TramiteCard.tsx
│   │   │   └── TramitePanel.tsx
│   │   └── ui
│   │       ├── Avatar.tsx
│   │       ├── Badge.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Divider.tsx
│   │       ├── Input.tsx
│   │       ├── Tag.tsx
│   │       └── Typography.tsx
│   ├── constants
│   │   ├── colors.ts
│   │   ├── roles.ts
│   │   ├── spacing.ts
│   │   └── typography.ts
│   ├── context
│   │   ├── NotificationsContext.tsx
│   │   └── UserContext.tsx
│   ├── hooks
│   │   ├── useAuth.ts
│   │   ├── useKeyboard.ts
│   │   ├── useNotifications.ts
│   │   └── useTheme.ts
│   ├── lib
│   │   ├── authService.ts
│   │   ├── chatService.ts
│   │   ├── supabaseClient.ts
│   │   └── tramitesService.ts
│   └── utils
│       ├── formatTime.ts
│       └── roleHelpers.ts
└── tsconfig.json
```
