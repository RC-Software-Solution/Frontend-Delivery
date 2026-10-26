# Graph Report - Frontend-Delivery  (2026-09-13)

## Corpus Check
- Corpus is ~32,503 words - fits in a single context window. You may not need a graph.

## Summary
- 429 nodes · 789 edges · 31 communities (19 shown, 12 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 33 edges (avg confidence: 0.84)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- App Screens & Navigation
- Authentication & Token Core
- User Auth API & Types
- NPM Dependencies
- Integration Documentation
- Package Metadata & Peripheral Imports
- Location Service Module
- Expo App Configuration
- Delivery Service Module
- Reset Project Script
- Auth Test Examples
- Dev Dependencies
- NPM Scripts
- TypeScript Config
- Delivery Branding Image
- Theme & Color Scheme
- Common Styles
- Partial React Logo Asset
- Home/Dining Nav Icon
- Sign-in Background Image
- ESLint Config
- React Logo Asset (2x)
- React Logo Asset (3x)
- React Logo Asset
- Splash Screen Icon
- Project README
- Global Type Declarations
- Adaptive App Icon
- Favicon Asset
- App Icon Asset
- Payment Nav Icon

## God Nodes (most connected - your core abstractions)
1. `AuthenticationService` - 24 edges
2. `ErrorUtils` - 22 edges
3. `BaseApiClient` - 21 edges
4. `react` - 20 edges
5. `UserApiClient` - 19 edges
6. `react-native` - 18 edges
7. `Area` - 18 edges
8. `DeliveryService` - 16 edges
9. `LocationService` - 16 edges
10. `TokenUtils` - 16 edges

## Surprising Connections (you probably didn't know these)
- `Smart Caching (2-minute order cache)` --semantically_similar_to--> `Area Caching (5-minute cache)`  [INFERRED] [semantically similar]
  DELIVERY_SERVICE_INTEGRATION.md → LOCATION_SERVICE_INTEGRATION.md
- `user-service (backend)` --conceptually_related_to--> `Authentication Implementation (doc)`  [INFERRED]
  OVERVIEW.md → AUTHENTICATION_IMPLEMENTATION.md
- `delivery-service (backend)` --conceptually_related_to--> `Delivery Service Integration (doc)`  [INFERRED]
  OVERVIEW.md → DELIVERY_SERVICE_INTEGRATION.md
- `locations-service (backend)` --conceptually_related_to--> `Location Service Integration (doc)`  [INFERRED]
  OVERVIEW.md → LOCATION_SERVICE_INTEGRATION.md
- `authService (singleton)` --conceptually_related_to--> `AuthenticationService`  [INFERRED]
  services/README.md → AUTHENTICATION_IMPLEMENTATION.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Area Selection to Order Delivery Data Flow** — location_service_integration_areaselectionscreen, screens_home_home_screen, delivery_service_integration_deliveryservice [INFERRED 0.85]
- **Backend Microservices to Frontend Integration Docs Mapping** — overview_userservice, overview_deliveryservice, overview_locationsservice, authentication_implementation, delivery_service_integration, location_service_integration [INFERRED 0.85]
- **Layered Services Architecture Pattern (config/types/utils/clients/service/hooks)** — authentication_implementation, delivery_service_integration, location_service_integration, services_readme [INFERRED 0.85]

## Communities (31 total, 12 thin omitted)

### Community 0 - "App Screens & Navigation"
Cohesion: 0.06
Nodes (33): TabsLayout(), CancelModal(), ModalProps, styles, styles, TabBar(), styles, TabBarButton() (+25 more)

### Community 1 - "Authentication & Token Core"
Cohesion: 0.09
Nodes (7): AuthenticationService, BaseApiClient, AuthExample(), styles, useAuth(), ApiResponse, TokenUtils

### Community 2 - "User Auth API & Types"
Cohesion: 0.09
Nodes (28): axios, @react-native-async-storage/async-storage, UserApiClient, API_CONFIG, ServiceName, AuthActions, AuthState, DELIVERY_ERROR_MESSAGES (+20 more)

### Community 3 - "NPM Dependencies"
Cohesion: 0.05
Nodes (38): dependencies, axios, expo, expo-blur, expo-constants, expo-font, @expo-google-fonts/nunito, @expo-google-fonts/raleway (+30 more)

### Community 4 - "Integration Documentation"
Cohesion: 0.08
Nodes (36): Authentication Implementation (doc), api.config.ts (User Service), AuthenticationService, BaseApiClient, JWT Token Management, Role-Based Authentication (delivery_person only), useAuth Hook, UserApiClient (+28 more)

### Community 5 - "Package Metadata & Peripheral Imports"
Cohesion: 0.06
Nodes (32): main, name, private, version, @babel/core, eslint, eslint-config-expo, expo (+24 more)

### Community 6 - "Location Service Module"
Cohesion: 0.14
Nodes (8): LocationApiClient, LocationExample(), styles, LocationActions, LocationState, useLocation(), LocationService, Area

### Community 7 - "Expo App Configuration"
Cohesion: 0.08
Nodes (23): backgroundColor, foregroundImage, adaptiveIcon, edgeToEdgeEnabled, typedRoutes, expo, android, experiments (+15 more)

### Community 8 - "Delivery Service Module"
Cohesion: 0.19
Nodes (4): DeliveryApiClient, DeliveryService, DeliveryOrder, GetAreaOrdersRequest

### Community 9 - "Reset Project Script"
Cohesion: 0.22
Nodes (7): exampleDirPath, fs, oldDirs, path, readline, rl, root

### Community 10 - "Auth Test Examples"
Cohesion: 0.33
Nodes (6): runCompleteAuthTest(), testAuthStatus(), testLoginFlow(), testLogout(), testTokenRefresh(), authService

### Community 11 - "Dev Dependencies"
Cohesion: 0.29
Nodes (7): devDependencies, @babel/core, eslint, eslint-config-expo, @types/react, @types/react-native, typescript

### Community 12 - "NPM Scripts"
Cohesion: 0.29
Nodes (7): scripts, android, ios, lint, reset-project, start, web

### Community 13 - "TypeScript Config"
Cohesion: 0.29
Nodes (6): expo/tsconfig.base, compilerOptions, paths, strict, extends, include

### Community 14 - "Delivery Branding Image"
Cohesion: 0.53
Nodes (6): Delivery Rider on Scooter with Food Box, Food Delivery / Order Tracking Concept, RC Food Delivery Illustration, Location Pin Icon, Phone Mockup with Map/Order-Tracking UI, RC Food Logo (spoon-and-fork wordmark)

### Community 16 - "Common Styles"
Cohesion: 0.50
Nodes (3): react-native-responsive-dimensions, react-native-responsive-screen, commonStyles

### Community 17 - "Partial React Logo Asset"
Cohesion: 0.67
Nodes (3): Expo/React Native Default Template Assets, React Framework, Partial React Logo Image

### Community 18 - "Home/Dining Nav Icon"
Cohesion: 0.67
Nodes (3): Dining/Food Domain (Restaurant Concierge App), Home Icon (Fork & Spoon Glyph), Navbar Icon Set

### Community 19 - "Sign-in Background Image"
Cohesion: 0.67
Nodes (3): Food Photography Visual Theme, Login / Sign-In Screen, Sign In Background Image

## Knowledge Gaps
- **165 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+160 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 198 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **12 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `NPM Dependencies` to `Package Metadata & Peripheral Imports`?**
  _High betweenness centrality (0.136) - this node is a cross-community bridge._
- **Why does `react` connect `App Screens & Navigation` to `Authentication & Token Core`, `User Auth API & Types`, `Package Metadata & Peripheral Imports`, `Location Service Module`?**
  _High betweenness centrality (0.093) - this node is a cross-community bridge._
- **Why does `axios` connect `User Auth API & Types` to `Package Metadata & Peripheral Imports`?**
  _High betweenness centrality (0.075) - this node is a cross-community bridge._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _165 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `App Screens & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.0597567424643046 - nodes in this community are weakly interconnected._
- **Should `Authentication & Token Core` be split into smaller, more focused modules?**
  _Cohesion score 0.08853410740203194 - nodes in this community are weakly interconnected._
- **Should `User Auth API & Types` be split into smaller, more focused modules?**
  _Cohesion score 0.08862745098039215 - nodes in this community are weakly interconnected._