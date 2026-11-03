# iOS build performance

The Intel builds have spent substantial time compiling native dependencies. React Native already uses its prebuilt core in these builds; the previous logs explicitly reference React-Core-prebuilt. Replacing that with a source build would add work.

## Changes

- Enable React Native's supported ccache integration using `USE_CCACHE=1`. The installed Expo template respects that environment variable. After CocoaPods installation, verify that the generated Pods project uses the ccache compiler wrapper.
- Persist compiler objects through GitHub Actions cache, capped at 2 GB per job. Keys separate device/simulator, runner architecture, Xcode/Clang/ccache toolchain fingerprint, and the JavaScript dependency lockfile. Each run saves an updated snapshot and restores the most recent compatible snapshot; content and compiler arguments still determine ccache hits. Compiler identity uses content hashing.
- Save compiler objects after failed builds too, where the runner remains available. An abruptly terminated runner cannot guarantee a cache upload. Cache download/save failures do not fail compilation. If ccache cannot be installed, the workflow warns and builds uncached.
- Cache pnpm's content store and CocoaPods download cache. Dependencies still install from the lockfile, and CocoaPods still resolves/prepares the generated project. Do not restore old generated iOS projects, signed applications, or whole DerivedData folders over current source.
- Redirect full Xcode output into an artifact log. Emit a brief progress line every 30 seconds instead of streaming every compiler argument to the Actions console. Preserve compiler exit status and print diagnostic output on failure. Both builds request Xcode's timing summary.
- Shut down the simulator after validation. Simulator and device remain isolated jobs with separate time limits.
- Add an optional standard runner choice (`macos-26-intel` or `macos-26`). Intel remains the default after the ARM acquisition failures. A different runner choice uses a separate compatible cache.

## Measuring results

The first optimized run starts with an empty compiler cache and may not be faster. Following compatible runs should show hits under **Native compiler cache** in the job summary. Inspect the `Steadier-build-performance-device` and `Steadier-build-performance-simulator` artifacts for the full build log and `ccache-stats.txt`. Compare compile-stage duration and hit rate on the same runner architecture before claiming an improvement. Ccache primarily helps C/C++/Objective-C work; it does not eliminate Swift compilation, linking or JavaScript bundling.

Local validation covers full-log capture, concise progress reporting and propagation of compiler failure exit codes; shell syntax, JavaScript syntax and workflow YAML parsing are checked. macOS cache integration and speedup require a future cloud run. The current in-flight build is neither cancelled nor restarted by these manual-workflow changes.

## Dispatch

Use the GitHub Run workflow form to select a standard Mac pool. The existing helper also accepts `dispatch device macos-26` or `dispatch simulator macos-26-intel`. Device-only mode is for app source with already-passed simulator validation. Normal dispatch still runs both independent jobs.

References: [React Native compiler caching](https://reactnative.dev/docs/build-speed#use-a-compiler-cache), [GitHub Actions cache](https://github.com/actions/cache).
