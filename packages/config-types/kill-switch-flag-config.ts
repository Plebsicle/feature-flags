import {environment_type} from "../db/client"

export interface killSwitchFlagConfig {
    flagKey : string,
    environments : environment_type[]
}

export interface killSwitchConfig {
    name : string,
    description? : string,
    flags : killSwitchFlagConfig[]
}

