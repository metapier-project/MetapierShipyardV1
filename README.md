# MetapierShipyardV1
A platform designed to streamline the process of launching projects on the Flow blockchain 
and bootstrapping liquidity for them.

## Project Structure
- "/contracts", "/transactions", and "/scripts" follow the common structure of a Flow project.
- "/test-libs" contains contracts, transactions, and scripts that are only used in the integration tests.
- "/test" contains integration tests under the JS test framework.

## How To Run Tests Manually?
Following these steps:
- Install the latest version of FLOW CLI
- `cd test`
- `npm install`
- `npm run build --if-present`
- `npm test`
