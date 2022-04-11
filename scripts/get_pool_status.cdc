import MetapierLaunchpad from "../contracts/MetapierLaunchpad.cdc"

pub fun main(poolId: String): &AnyResource {
    return MetapierLaunchpad.getPublicLaunchPoolById(poolId: poolId)!
}
