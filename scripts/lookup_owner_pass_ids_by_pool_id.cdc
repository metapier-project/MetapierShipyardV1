import MetapierLaunchpadOwnerPass from "../contracts/MetapierLaunchpadOwnerPass.cdc"

pub fun main(address: Address, poolId: String): [UInt64] {
    let passCollection = getAccount(address)
        .getCapability<&MetapierLaunchpadOwnerPass.Collection{MetapierLaunchpadOwnerPass.CollectionPublic}>(MetapierLaunchpadOwnerPass.CollectionPublicPath)
        .borrow() ?? panic("could not find pass collection")

    return passCollection.getIdsByPoolId(poolId: poolId)
}
