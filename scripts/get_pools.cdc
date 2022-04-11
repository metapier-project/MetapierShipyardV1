import MetapierLaunchpad from "../contracts/MetapierLaunchpad.cdc"

pub fun main(): [String] {
    return MetapierLaunchpad.getPoolIds()
}
