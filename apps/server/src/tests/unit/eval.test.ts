import {it,vi,expect,describe} from 'vitest'
import request from 'supertest'
import {app} from '../../index'

vi.mock("../../services/redis/killSwitchCaching");

import {getFlagWithKillSwitches} from "../../services/redis/__mocks__/killSwitchCaching"

describe('Testing Eval endpoint', ()=>{

    it('should pass',async ()=>{
        getFlagWithKillSwitches.mockReturnValue({
        flagData: {
          flagId: '1',
          flag_type: "BOOLEAN",
          is_active: true,
          environment: "DEV",
          is_environment_active: true,
          value: { "value": true },
          default_value: { "value" : false },
          rules: [
            {
              name: "US Email Users",
              rule_id: "1",
              conditions: [
                {
                  attribute_name: "user email",
                  attribute_type: "ARRAY",
                  attribute_values: [
                    "praval@gmail.com",
                    "plebsicle@gmail.com"
                  ],
                  operator_selected: 'contains_any'
                }
              ],
              is_enabled: true
            }
          ],
        rollout_config: {
          percentage: 90,
          startDate: "2025-07-25T04:27:29.934Z",
          endDate: "2025-07-27T04:27:29.934Z"
        }
        },
          killSwitches: []
        })
        const userContext = {
            "user email" : ["praval@gmail.com"]
        };
        

        const res = await request(app).post('/evaluation').send({
            flagKey : "1",
            environment : "DEV",
            userContext : userContext,
            orgSlug : '123'
        });

         expect(res.status).toBe(200);
         expect(res.body.result.flagKey).toBe("1");    
         expect(res.body.result.enabled).toBe(true);
         expect(res.body.result.ruleMatched).toBe("US Email Users");
         expect(res.body.result.value).toBe(true);
    });

    it("should serve def value", async()=>{
        getFlagWithKillSwitches.mockReturnValue({
        flagData: {
        flagId: '1',
        flag_type: "BOOLEAN",
        is_active: true,
        environment: "DEV",
        is_environment_active: true,
        value: { "value": true },
        default_value: { "value" : false },
        rules: [
          {
            name: "US Email Users",
            rule_id: "1",
            conditions: [
              {
                attribute_name: "user email",
                attribute_type: "ARRAY",
                attribute_values: [
                  "praval@gmail.com",
                  "plebsicle@gmail.com"
                ],
                operator_selected: 'contains_any'
              }
            ],
            is_enabled: true
          }
        ],
        rollout_config: {
          percentage: 90,
          startDate: "2025-07-25T04:27:29.934Z",
          endDate: "2025-07-27T04:27:29.934Z"
        }
            },
            killSwitches: [
                {
                    id : "1",
                    killSwitchKey : "12",
                    flag : [
                        
                    ],
                    is_active : true
                }
            ]
        })
         const userContext = {
            "user email" : ["praval@gmail.com"]
        };
    
        const res = await request(app).post('/evaluation').send({
            flagKey : "1",
            environment : "DEV",
            userContext : userContext,
            orgSlug : '123'
        });

         expect(res.status).toBe(200);
         expect(res.body.result.value).toBe(false);
    });

    it('should evaluate STRING flag with string conditions', async () => {
        getFlagWithKillSwitches.mockReturnValue({
            flagData: {
                flagId: '2',
                flag_type: "STRING",
                is_active: true,
                environment: "DEV",
                is_environment_active: true,
                value: { "value": "premium-feature" },
                default_value: { "value": "basic-feature" },
                rules: [
                    {
                        name: "Premium Users",
                        rule_id: "2",
                        conditions: [
                            {
                                attribute_name: "userTier",
                                attribute_type: "STRING",
                                attribute_values: "premium",
                                operator_selected: 'equals'
                            },
                            {
                                attribute_name: "region",
                                attribute_type: "STRING", 
                                attribute_values: "US",
                                operator_selected: 'starts_with'
                            }
                        ],
                        is_enabled: true
                    }
                ],
                rollout_config: {
                    percentage: 100,
                    startDate: "2025-01-01T00:00:00.000Z",
                    endDate: "2025-12-31T23:59:59.999Z"
                }
            },
            killSwitches: []
        });

        const userContext = {
            "userTier": "premium",
            "region": "US-East"
        };

        const res = await request(app).post('/evaluation').send({
            flagKey: "2",
            environment: "DEV",
            userContext: userContext,
            orgSlug: '123'
        });

        expect(res.status).toBe(200);
        expect(res.body.result.flagKey).toBe("2");
        expect(res.body.result.enabled).toBe(true);
        expect(res.body.result.ruleMatched).toBe("Premium Users");
        expect(res.body.result.value).toBe("premium-feature");
    });

    it('should evaluate NUMBER flag with numeric conditions', async () => {
        getFlagWithKillSwitches.mockReturnValue({
            flagData: {
                flagId: '3',
                flag_type: "NUMBER",
                is_active: true,
                environment: "DEV",
                is_environment_active: true,
                value: { "value": 50 },
                default_value: { "value": 10 },
                rules: [
                    {
                        name: "High Value Users",
                        rule_id: "3",
                        conditions: [
                            {
                                attribute_name: "accountValue",
                                attribute_type: "NUMBER",
                                attribute_values: 1000,
                                operator_selected: 'greater_than'
                            },
                            {
                                attribute_name: "loginCount",
                                attribute_type: "NUMBER",
                                attribute_values: 50,
                                operator_selected: 'greater_than_equal'
                            }
                        ],
                        is_enabled: true
                    }
                ],
                rollout_config: {
                    percentage: 75,
                    startDate: "2025-01-01T00:00:00.000Z",
                    endDate: "2025-12-31T23:59:59.999Z"
                }
            },
            killSwitches: []
        });

        const userContext = {
            "accountValue": 1500,
            "loginCount": 75,
            "userId": "user123" 
        };

        const res = await request(app).post('/evaluation').send({
            flagKey: "3",
            environment: "DEV",
            userContext: userContext,
            orgSlug: '123'
        });

        expect(res.status).toBe(200);
        expect(res.body.result.flagKey).toBe("3");
        expect(res.body.result.enabled).toBe(true);
        expect(res.body.result.ruleMatched).toBe("High Value Users");
        expect(res.body.result.value).toBe(50);
    });

    it('should evaluate JSON flag with multiple rules and date conditions', async () => {
        getFlagWithKillSwitches.mockReturnValue({
            flagData: {
                flagId: '4',
                flag_type: "JSON",
                is_active: true,
                environment: "DEV",
                is_environment_active: true,
                value: { "value": { "theme": "dark", "sidebar": "expanded", "notifications": true } },
                default_value: { "value": { "theme": "light", "sidebar": "collapsed", "notifications": false } },
                rules: [
                    {
                        name: "Beta Users",
                        rule_id: "4a",
                        conditions: [
                            {
                                attribute_name: "isBetaUser",
                                attribute_type: "BOOLEAN",
                                attribute_values: true,
                                operator_selected: 'is_true'
                            }
                        ],
                        is_enabled: true
                    },
                    {
                        name: "Recent Joiners",
                        rule_id: "4b",
                        conditions: [
                            {
                                attribute_name: "joinDate",
                                attribute_type: "DATE",
                                attribute_values: "2025-01-01T00:00:00.000Z",
                                operator_selected: 'after'
                            }
                        ],
                        is_enabled: true
                    }
                ],
                rollout_config: {
                    percentage: 60,
                    startDate: "2025-01-01T00:00:00.000Z",
                    endDate: "2025-12-31T23:59:59.999Z"
                }
            },
            killSwitches: []
        });

        const userContext = {
            "isBetaUser": false,
            "joinDate": "2025-06-15T10:30:00.000Z",
            "userId": "user456"
        };

        const res = await request(app).post('/evaluation').send({
            flagKey: "4",
            environment: "DEV",
            userContext: userContext,
            orgSlug: '123'
        });

        expect(res.status).toBe(200);
        expect(res.body.result.flagKey).toBe("4");
        expect(res.body.result.enabled).toBe(true);
        expect(res.body.result.ruleMatched).toBe("Recent Joiners");
        expect(res.body.result.value).toEqual({ 
            "theme": "dark", 
            "sidebar": "expanded", 
            "notifications": true 
        });
    });

    it('should evaluate AB_TEST flag with variant selection', async () => {
        getFlagWithKillSwitches.mockReturnValue({
            flagData: {
                flagId: '5',
                flag_type: "AB_TEST",
                is_active: true,
                environment: "DEV",
                is_environment_active: true,
                value: { 
                    "value": { 
                        "control": "Original Button", 
                        "treatment": "New Button Design" 
                    } 
                },
                default_value: { "value": "Original Button" },
                rules: [
                    {
                        name: "All Active Users",
                        rule_id: "5",
                        conditions: [
                            {
                                attribute_name: "isActive",
                                attribute_type: "BOOLEAN",
                                attribute_values: true,
                                operator_selected: 'is_true'
                            },
                            {
                                attribute_name: "countryTest",
                                attribute_type: "ARRAY",
                                attribute_values: ["US", "CA", "UK"],
                                operator_selected: 'contains_any'
                            }
                        ],
                        is_enabled: true
                    }
                ],
                rollout_config: {
                    percentage: 80,
                    startDate: "2025-01-01T00:00:00.000Z",
                    endDate: "2025-12-31T23:59:59.999Z"
                }
            },
            killSwitches: []
        });

        const userContext = {
            "isActive": true,
            "countryTest": ["US"],
            "userId": "abtest-user789"
        };

        const res = await request(app).post('/evaluation').send({
            flagKey: "5",
            environment: "DEV",
            userContext: userContext,
            orgSlug: '123'
        });

        expect(res.status).toBe(200);
        expect(res.body.result.flagKey).toBe("5");
        expect(res.body.result.enabled).toBe(true);
        expect(res.body.result.ruleMatched).toBe("All Active Users");

        expect(['Original Button', 'New Button Design']).toContain(res.body.result.value);
    });
});


