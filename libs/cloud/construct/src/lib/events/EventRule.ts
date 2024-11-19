// @ts-strict-ignore
import { IRule, RuleTargetConfig } from 'aws-cdk-lib/aws-events'
import { IRuleTarget } from 'aws-cdk-lib/aws-events'
import { Role } from 'aws-cdk-lib/aws-iam'

export class EventRule implements IRuleTarget {
	role: Role
	arn: string
	constructor(role, arn) {
		this.role = role
		this.arn = arn
	}
	bind(rule: IRule, id?: string): RuleTargetConfig {
		return {
			arn: this.arn,
			role: this.role,
		}
	}
}
