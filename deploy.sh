#/bin/bash

flow accounts create \
--key "125808676029a9cea42e3ab064cc9a44e4a0b509102bc8c0f465b5bd625f8a45b9cc4f7c8970379857acb8d8e4f4840468356431b1dd2381cb8e8c14d6defc6a" \
--sig-algo "ECDSA_secp256k1" \
--signer "emulator-account"

flow accounts create \
--key "78ea610975867b95162dfe50858337b9ec70bb593fec337644d514b66b0abc6f9972d73de451fd88582d2bda34171d6f0bac4a2da7ec2c258af2d5f910978b94" \
--sig-algo "ECDSA_secp256k1" \
--signer "emulator-account"

flow accounts create \
--key "22ea3f5dbf7cb0fc11e5aab387e7a558055499472d988c57356dac3a682746f156a4233cf31604e105dc65b35d2b8458096ad7b082e61a05b4eee2b6f18d019b" \
--sig-algo "ECDSA_secp256k1" \
--signer "emulator-account"

flow project deploy
