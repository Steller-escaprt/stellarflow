# Changelog

## [1.1.0](https://github.com/Steller-escaprt/stellarflow/compare/frontend-v1.0.0...frontend-v1.1.0) (2026-11-04)


### Features

* **branding:** Replace all menu items and write-up with authentic StellarFlow protocol identity ([aafb3b6](https://github.com/Steller-escaprt/stellarflow/commit/aafb3b679ceb7d2013357b24732ca87df0815142))
* **contracts:** Implement StreamRouterContract for cross-contract atomic batch dispatch and split routing ([8c70741](https://github.com/Steller-escaprt/stellarflow/commit/8c707413812c4f35d60efc1121a10ff1d1e0f183))
* **grant-readiness:** Add SEP-1 stellar.toml, SCF Tier-2 budget table, formal MATH_SPEC, and 35 invariant tests (307 total) ([e62ea95](https://github.com/Steller-escaprt/stellarflow/commit/e62ea959af55d728999bd41dc5a6162a8ca7b547))
* Initial release of StellarFlow protocol ([bab0b19](https://github.com/Steller-escaprt/stellarflow/commit/bab0b19f76502a620b8b4c6d0ca33d490a7b30aa))
* **protocol:** Implement SEP-7 URI bridge, Soroban RPC event streamer, and fix all commit audit issues ([2d79064](https://github.com/Steller-escaprt/stellarflow/commit/2d79064b216d579d07da64ccf0f1523243b41509))
* **protocol:** Implement stellarflow-cli, Soroban resource meter inspector, and CAP-15 fee-bump XDR bridge ([60144dc](https://github.com/Steller-escaprt/stellarflow/commit/60144dc0955d9e28f397649b43905cbd4fcfaf29))
* **ui:** Complete retro OS design with ambient canvas, rotating compass HUD, floating windows, interactive playground, and notes checklist ([75aa106](https://github.com/Steller-escaprt/stellarflow/commit/75aa10686a7fdd487b796c25cc842a7cf4ef3b06))
* **ui:** Implement retro OS desktop experience, window management, custom protocol graphics, and CLI terminal inspired by debabratagiri ([4b7cefa](https://github.com/Steller-escaprt/stellarflow/commit/4b7cefa14ad5df1d4a702030fe204b98ad21ad3c))


### Bug Fixes

* **build:** Resolve typescript version compatibility, fix lint errors, and configure vercel monorepo build ([7b5488f](https://github.com/Steller-escaprt/stellarflow/commit/7b5488fedd92f2397968b7b24e955baab70d5691))
* **client:** Secure websocket url construction, add error boundary, and prevent blank screen ([9fd3a28](https://github.com/Steller-escaprt/stellarflow/commit/9fd3a282fc72bc565f6ea7335daa6f87aeb0b053))
* **deps:** Remove unused storybook devDependencies from frontend to resolve Vercel ERESOLVE error ([6a368ac](https://github.com/Steller-escaprt/stellarflow/commit/6a368aca4bc01effda695172703380dedfebc6d4))
* **deps:** Resolve storybook peer dependency conflict and configure legacy-peer-deps for Vercel ([351494b](https://github.com/Steller-escaprt/stellarflow/commit/351494ba60aa05b0c4083a13bbfa9371f61b1b59))
* Remove all storybook files and align react-dom types to v18 ([ca1bd1a](https://github.com/Steller-escaprt/stellarflow/commit/ca1bd1aef32c32634a588b842661abe13be9bc41))
* **theme:** Add backwards compatibility fallback for legacy theme storage key ([6304bc5](https://github.com/Steller-escaprt/stellarflow/commit/6304bc5ab6d89479d2ce7ba3f386a82f7e742a32))


### Tests

* **frontend:** Add comprehensive test suite for token formatting utilities ([ffa4377](https://github.com/Steller-escaprt/stellarflow/commit/ffa437728a7c1758f2785816bf12f13555ff05d8))
