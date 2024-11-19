#!/usr/bin/env node
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager'
import { CloudFrontWebDistribution, OriginAccessIdentity, SSLMethod, SecurityPolicyProtocol, ViewerCertificate } from 'aws-cdk-lib/aws-cloudfront'
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { ARecord, HostedZone, RecordTarget } from 'aws-cdk-lib/aws-route53'
import { CloudFrontTarget } from 'aws-cdk-lib/aws-route53-targets'
import { Bucket } from 'aws-cdk-lib/aws-s3'
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment'
import { CfnOutput, RemovalPolicy } from 'aws-cdk-lib/core'
import { Construct } from 'constructs'

export interface StaticWebsiteProps {
    domainName: string // i.e. uat.example.com
    rootDomainAccess?: boolean
    siteSubDomain: string // i.e. "www" for www.uat.example.com
    assets: string
    usEast1CertificateArn: string
    hostedZoneId: string // Hosted zone for
    waitBucketDeployment?: BucketDeployment
}

/**
 * Static site infrastructure, which deploys site content to an S3 bucket.
 *
 * The site redirects from HTTP to HTTPS, using a CloudFront distribution,
 * Route53 alias record, and ACM certificate.
 */
export class StaticWebsite extends Construct {
    public bucketName: string
    public bucketArn: string
    public bucketDeployment: BucketDeployment

    constructor(parent: Construct, name: string, props: StaticWebsiteProps) {
        super(parent, name)

        const zone = HostedZone.fromHostedZoneAttributes(this, 'Zone', {
            zoneName: props.domainName,
            hostedZoneId: props.hostedZoneId,
        })

        const completeDomainName = props.siteSubDomain + '.' + props.domainName

        new CfnOutput(this, 'Site', { value: 'https://' + completeDomainName })

        // Content bucket
        const siteBucket = new Bucket(this, 'SiteBucket', {
            bucketName: completeDomainName,
            websiteIndexDocument: 'index.html',
            websiteErrorDocument: 'index.html',
            autoDeleteObjects: true,
            removalPolicy: RemovalPolicy.DESTROY,
        })
        new CfnOutput(this, 'Bucket', { value: siteBucket.bucketName })

        const originAccessIdentity = new OriginAccessIdentity(this, 'OAI', {
            comment: 'Allows CloudFront to reach the bucket',
        })
        siteBucket.grantRead(originAccessIdentity)

        this.bucketName = siteBucket.bucketName
        this.bucketArn = siteBucket.bucketArn

        const certificate = Certificate.fromCertificateArn(this, 'DistributionCertificate', props.usEast1CertificateArn)

        // CloudFront distribution that provides HTTPS
        const distribution = new CloudFrontWebDistribution(this, 'SiteDistribution', {
            viewerCertificate: ViewerCertificate.fromAcmCertificate(certificate, {
                aliases: [completeDomainName],
                sslMethod: SSLMethod.SNI,
                securityPolicy: SecurityPolicyProtocol.TLS_V1_1_2016,
            }
            ),
            originConfigs: [
                {
                    s3OriginSource: {
                        s3BucketSource: siteBucket,
                        originAccessIdentity: originAccessIdentity,
                    },
                    behaviors: [{ isDefaultBehavior: true }],
                },
            ],
            errorConfigurations: [
                {
                    errorCode: 404,
                    errorCachingMinTtl: 10,
                    responseCode: 200,
                    responsePagePath: '/index.html',
                },
            ],
        })
        new CfnOutput(this, 'DistributionId', { value: distribution.distributionId })

        // Route53 alias record for the CloudFront distribution
        new ARecord(this, 'SiteAliasRecord', {
            recordName: completeDomainName,
            target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
            zone: zone,
        })

        if (props.rootDomainAccess) {
            new ARecord(this, 'SiteRootAliasRecord', {
                recordName: props.domainName,
                target: RecordTarget.fromAlias(new CloudFrontTarget(distribution)),
                zone: zone,
            })
        }

        const bucketDeploymentRole = new Role(this, 'BucketDeploymentRole', {
            assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        })

        // Deploy site contents to S3 bucket
        this.bucketDeployment = new BucketDeployment(this, 'DeployWithInvalidation', {
            sources: [Source.asset(props.assets)],
            destinationBucket: siteBucket,
            distribution,
            role: bucketDeploymentRole,
            distributionPaths: ['/*'],
        })

        if (props.waitBucketDeployment) {
            this.bucketDeployment.node.addDependency(props.waitBucketDeployment)
        }
    }
}
