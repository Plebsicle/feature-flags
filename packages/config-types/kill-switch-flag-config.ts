type environment_type = "STAGING" | "PROD" | "DEV" | "TEST"

export interface killSwitchFlagConfig {
    flagKey : string,
    environments : environment_type[]
}

export interface killSwitchConfig {
    name : string,
    description? : string,
    flags : killSwitchFlagConfig[]
}

