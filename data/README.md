# Data Persistence Directory

This directory is used to store non-critical data for persistence, i.e. verification results from twilio, to avoid needing to re-verify users and whatnot.
This directory should be used with the mentality that:

1. Data can be deleted at any time, and should not cause issues if it is deleted. It may be stored for convenience, or optimisation, but removing data should not cause issues.
