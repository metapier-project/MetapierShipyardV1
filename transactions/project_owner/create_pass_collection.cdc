import MetapierLaunchpadOwnerPass from "../../contracts/MetapierLaunchpadOwnerPass.cdc"
import NonFungibleToken from "../../contracts/NonFungibleToken.cdc"

transaction() {
    prepare(projectOwner: AuthAccount) {
        // Return early if the account already has a collection
        if projectOwner.borrow<&MetapierLaunchpadOwnerPass.Collection>(from: MetapierLaunchpadOwnerPass.CollectionStoragePath) != nil {
            return
        }

        // Create a new empty collection
        let collection <- MetapierLaunchpadOwnerPass.createEmptyCollection()

        // save it to the account
        projectOwner.save(<-collection, to: MetapierLaunchpadOwnerPass.CollectionStoragePath)

        // create a public capability for the collection
        projectOwner.link<&MetapierLaunchpadOwnerPass.Collection{NonFungibleToken.CollectionPublic, MetapierLaunchpadOwnerPass.CollectionPublic}>(
            MetapierLaunchpadOwnerPass.CollectionPublicPath,
            target: MetapierLaunchpadOwnerPass.CollectionStoragePath
        )
    }
}