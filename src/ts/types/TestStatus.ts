// // TODO this is a test "result", rather than a status, if we exclude the transitionary states ("queued" and "running")
// export type TestStatus = "Passed" | "Failed" | "Skipped"; // | Queued | Running (actaully I don't think Mocha tells us until after it's been run........)

export type TestStatus = "Passed" | "Failed" | "Skipped";