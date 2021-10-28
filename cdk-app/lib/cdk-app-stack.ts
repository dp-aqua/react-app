import * as cdk from "@aws-cdk/core";
import * as ec2 from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import * as ecr from "@aws-cdk/aws-ecr";
import * as ecr_assets from "@aws-cdk/aws-ecr-assets";
import * as ecs_patterns from "@aws-cdk/aws-ecs-patterns";
import * as s3 from "@aws-cdk/aws-s3";
import * as s3Deployment from "@aws-cdk/aws-s3-deployment";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as certificate_manager from "@aws-cdk/aws-certificatemanager";
import * as route53 from "@aws-cdk/aws-route53";
import * as elasticloadbalancingv2 from "@aws-cdk/aws-elasticloadbalancingv2";
import { CertificateValidation } from "@aws-cdk/aws-certificatemanager";
import { env } from "process";

import * as iam from "@aws-cdk/aws-iam";
import * as codebuild from "@aws-cdk/aws-codebuild";
import * as codecommit from "@aws-cdk/aws-codecommit";
import * as targets from "@aws-cdk/aws-events-targets";
import * as codedeploy from "@aws-cdk/aws-codedeploy";
import * as codepipeline from "@aws-cdk/aws-codepipeline";
import * as codepipeline_actions from "@aws-cdk/aws-codepipeline-actions";
// export class CdkAppStack extends cdk.Stack {
//   constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
//     super(scope, id, props);

//     // The code that defines your stack goes here

//     //New cdk stack definition

//     // Create a Docker image and upload it to the Amazon Elastic Container Registry (ECR)
//     const dockerImage = new ecr_assets.DockerImageAsset(
//       this,
//       "MyJDPDockerImage",
//       {
//         directory: "../",
//       }
//     );

//     // Create a new VPC and NAT Gateway
//     const vpc = new ec2.Vpc(this, "MyNewJDPVpc", {
//       maxAzs: 3, // Default is all AZs in region
//     });

//     // Create a new Amazon Elastic Container Service (ECS) cluster
//     const cluster = new ecs.Cluster(this, "MyNewJDPCluster", {
//       vpc: vpc,
//     });

//     // Create a new hosted zone
//     // const hostedZone = new route53.HostedZone(this, "MyHostedZone", {
//     //   zoneName: "investwithaqua.com",
//     // });

//     const hostedZone = route53.HostedZone.fromLookup(
//       this,
//       "NewLatestHostedZone",
//       {
//         domainName: "investwithaqua.com",
//       }
//     );

//     // Create a new Certificate
//     const certificate = new certificate_manager.Certificate(
//       this,
//       "MyNewCertificate",
//       {
//         domainName: "testing.investwithaqua.com",
//         validation: certificate_manager.CertificateValidation.fromDns(
//           hostedZone
//         ),
//       }
//     );
//     const envUSA = { account: "822203125410", region: "us-east-1" };
//     // Create a load-balanced Fargate service and make it public
//     new ecs_patterns.ApplicationLoadBalancedFargateService(
//       this,
//       "MyNewJDPFargateService",
//       {
//         cluster: cluster, // Required
//         cpu: 512, // Default is 256
//         desiredCount: 2, // Default is 1
//         taskImageOptions: {
//           image: ecs.ContainerImage.fromDockerImageAsset(dockerImage),
//         },
//         memoryLimitMiB: 2048, // Default is 512
//         publicLoadBalancer: true, // Default is false
//         protocol: elasticloadbalancingv2.ApplicationProtocol.HTTPS,
//         certificate: certificate,
//         redirectHTTP: true,
//         domainName: "testing.investwithaqua.com",
//         domainZone: route53.HostedZone.fromLookup(this, "LatestNewHostedZone", {
//           domainName: "investwithaqua.com",
//         }),
//       }
//     );
//   }
// }

export class CdkAppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // The code that defines your stack goes here

    //New cdk stack definition

    // Create a Docker image and upload it to the Amazon Elastic Container Registry (ECR)
    const dockerImage = new ecr_assets.DockerImageAsset(
      this,
      "MyJDPDockerImage",
      {
        directory: "../",
      }
    );

    const clusterAdmin = new iam.Role(this, "AdminRole", {
      assumedBy: new iam.AccountRootPrincipal(),
    });

    // Create a new VPC and NAT Gateway
    const vpc = new ec2.Vpc(this, "PipelineJDPVpc", {
      maxAzs: 3, // Default is all AZs in region
    });

    // Create a new Amazon Elastic Container Service (ECS) cluster
    const cluster = new ecs.Cluster(this, "PipelineJDPCluster", {
      vpc: vpc,
    });

    const logging = new ecs.AwsLogDriver({
      streamPrefix: "ecs-logs",
    });

    const taskRole = new iam.Role(this, `ecs-taskRole-${this.stackName}`, {
      roleName: `ecs-taskRole-${this.stackName}`,
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
    });

    const executionRolePolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: ["*"],
      actions: [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
      ],
    });

    const taskDef = new ecs.FargateTaskDefinition(this, "ecs-taskdef", {
      taskRole: taskRole,
    });

    taskDef.addToExecutionRolePolicy(executionRolePolicy);

    const container = taskDef.addContainer("react-app", {
      image: ecs.ContainerImage.fromRegistry("dp1851/sample-app:prod"),
      memoryLimitMiB: 256,
      cpu: 256,
      logging,
    });

    container.addPortMappings({
      containerPort: 5000,
      protocol: ecs.Protocol.TCP,
    });

    // Create a new hosted zone
    // const hostedZone = new route53.HostedZone(this, "MyHostedZone", {
    //   zoneName: "investwithaqua.com",
    // });

    const hostedZone = route53.HostedZone.fromLookup(
      this,
      "PipelineLatestHostedZone",
      {
        domainName: "investwithaqua.com",
      }
    );

    // Create a new Certificate
    const certificate = new certificate_manager.Certificate(
      this,
      "MyNewCertificate",
      {
        domainName: "pipeline.investwithaqua.com",
        validation: certificate_manager.CertificateValidation.fromDns(
          hostedZone
        ),
      }
    );
    // const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(
    //   this,
    //   "ecs-service",
    //   {
    //     cluster: cluster,
    //     taskDefinition: taskDef,
    //     publicLoadBalancer: true,
    //     desiredCount: 3,
    //     listenerPort: 80,
    //   }
    // );
    const envUSA = { account: "822203125410", region: "us-east-1" };
    // Create a load-balanced Fargate service and make it public
    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(
      this,
      "PipelineJDPFargateService",
      {
        cluster: cluster, // Required
        cpu: 512, // Default is 256
        desiredCount: 2, // Default is 1
        taskDefinition: taskDef,
        // taskImageOptions: {
        //   image: ecs.ContainerImage.fromDockerImageAsset(dockerImage),
        // },
        memoryLimitMiB: 2048, // Default is 512
        publicLoadBalancer: true, // Default is false
        protocol: elasticloadbalancingv2.ApplicationProtocol.HTTPS,
        certificate: certificate,
        redirectHTTP: true,
        domainName: "pipeline.investwithaqua.com",
        domainZone: route53.HostedZone.fromLookup(this, "PipelineHostedZone", {
          domainName: "investwithaqua.com",
        }),
      }
    );

    // ECR - repo
    const ecrRepo = new ecr.Repository(this, "EcrRepo");

    const gitHubSource = codebuild.Source.gitHub({
      owner: "investwithaqua",
      repo: "react-app",
      webhook: true, // optional, default: true if `webhookFilteres` were provided, false otherwise
      webhookFilters: [
        codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs(
          "main"
        ),
      ], // optional, by default all pushes and Pull Requests will trigger a build
    });

    // CODEBUILD - project
    const project = new codebuild.Project(this, "MyProject", {
      projectName: `${this.stackName}`,
      source: gitHubSource,
      environment: {
        buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_2,
        privileged: true,
      },
      environmentVariables: {
        CLUSTER_NAME: {
          value: `${cluster.clusterName}`,
        },
        ECR_REPO_URI: {
          value: `${ecrRepo.repositoryUri}`,
        },
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: "0.2",
        phases: {
          pre_build: {
            commands: [
              "env",
              "export TAG=${CODEBUILD_RESOLVED_SOURCE_VERSION}",
            ],
          },
          build: {
            commands: [
              "cd flask-docker-app",
              `docker build -t $ECR_REPO_URI:$TAG .`,
              "$(aws ecr get-login --no-include-email)",
              "docker push $ECR_REPO_URI:$TAG",
            ],
          },
          post_build: {
            commands: [
              'echo "In Post-Build Stage"',
              "cd ..",
              'printf \'[{"name":"react-app","imageUri":"%s"}]\' $ECR_REPO_URI:$TAG > imagedefinitions.json',
              "pwd; ls -al; cat imagedefinitions.json",
            ],
          },
        },
        artifacts: {
          files: ["imagedefinitions.json"],
        },
      }),
    });

    // ***PIPELINE ACTIONS***

    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();
    const oauth = cdk.SecretValue.secretsManager("my-github-token");

    const sourceAction = new codepipeline_actions.GitHubSourceAction({
      actionName: "GitHub_Source",
      owner: "investwithaqua",
      repo: "react-app",
      branch: "main",
      oauthToken: cdk.SecretValue.plainText("822203125410"),
      //oauthToken: cdk.SecretValue.plainText('<plain-text>'),
      output: sourceOutput,
    });

    const buildAction = new codepipeline_actions.CodeBuildAction({
      actionName: "CodeBuild",
      project: project,
      input: sourceOutput,
      outputs: [buildOutput], // optional
    });

    const manualApprovalAction = new codepipeline_actions.ManualApprovalAction({
      actionName: "Approve",
    });

    const deployAction = new codepipeline_actions.EcsDeployAction({
      actionName: "DeployAction",
      service: fargateService.service,
      imageFile: new codepipeline.ArtifactPath(
        buildOutput,
        `imagedefinitions.json`
      ),
    });

    // PIPELINE STAGES

    new codepipeline.Pipeline(this, "MyECSPipeline", {
      stages: [
        {
          stageName: "Source",
          actions: [sourceAction],
        },
        {
          stageName: "Build",
          actions: [buildAction],
        },
        {
          stageName: "Approve",
          actions: [manualApprovalAction],
        },
        {
          stageName: "Deploy-to-ECS",
          actions: [deployAction],
        },
      ],
    });

    ecrRepo.grantPullPush(project.role!);
    project.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          "ecs:DescribeCluster",
          "ecr:GetAuthorizationToken",
          "ecr:BatchCheckLayerAvailability",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
        ],
        resources: [`${cluster.clusterArn}`],
      })
    );

    //OUTPUT

    new cdk.CfnOutput(this, "LoadBalancerDNS", {
      value: fargateService.loadBalancer.loadBalancerDnsName,
    });
  }
}

//import cdk = require('@aws-cdk/core');
//import ec2 = require("@aws-cdk/aws-ec2");
//import ecr = require('@aws-cdk/aws-ecr');
//import ecs = require("@aws-cdk/aws-ecs");
//import ecs_patterns = require("@aws-cdk/aws-ecs-patterns");

// export class EcsCdkStack extends cdk.Stack {
//   constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
//     super(scope, id, props);

/**
 * Create a new VPC with single NAT Gateway
 */
// const vpc = new ec2.Vpc(this, "ecs-cdk-vpc", {
//   cidr: "10.0.0.0/16",
//   natGateways: 1,
//   maxAzs: 3,
// });

// const clusterAdmin = new iam.Role(this, "AdminRole", {
//   assumedBy: new iam.AccountRootPrincipal(),
// });

// const cluster = new ecs.Cluster(this, "ecs-cluster", {
//   vpc: vpc,
// });

// const logging = new ecs.AwsLogDriver({
//   streamPrefix: "ecs-logs",
// });

// const taskRole = new iam.Role(this, `ecs-taskRole-${this.stackName}`, {
//   roleName: `ecs-taskRole-${this.stackName}`,
//   assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
// });

// ***ECS Contructs***

// const executionRolePolicy = new iam.PolicyStatement({
//   effect: iam.Effect.ALLOW,
//   resources: ["*"],
//   actions: [
//     "ecr:GetAuthorizationToken",
//     "ecr:BatchCheckLayerAvailability",
//     "ecr:GetDownloadUrlForLayer",
//     "ecr:BatchGetImage",
//     "logs:CreateLogStream",
//     "logs:PutLogEvents",
//   ],
// });

// const taskDef = new ecs.FargateTaskDefinition(this, "ecs-taskdef", {
//   taskRole: taskRole,
// });

// taskDef.addToExecutionRolePolicy(executionRolePolicy);

// const container = taskDef.addContainer("flask-app", {
//   image: ecs.ContainerImage.fromRegistry("nikunjv/flask-image:blue"),
//   memoryLimitMiB: 256,
//   cpu: 256,
//   logging,
// });

// container.addPortMappings({
//   containerPort: 5000,
//   protocol: ecs.Protocol.TCP,
// });

// const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(
//   this,
//   "ecs-service",
//   {
//     cluster: cluster,
//     taskDefinition: taskDef,
//     publicLoadBalancer: true,
//     desiredCount: 3,
//     listenerPort: 80,
//   }
// );

// const scaling = fargateService.service.autoScaleTaskCount({
//   maxCapacity: 6,
// });
// scaling.scaleOnCpuUtilization("CpuScaling", {
//   targetUtilizationPercent: 10,
//   scaleInCooldown: cdk.Duration.seconds(60),
//   scaleOutCooldown: cdk.Duration.seconds(60),
// });

// ***PIPELINE CONSTRUCTS***

// // ECR - repo
// const ecrRepo = new ecr.Repository(this, "EcrRepo");

// const gitHubSource = codebuild.Source.gitHub({
//   owner: "user-name",
//   repo: "amazon-ecs-fargate-cdk-cicd",
//   webhook: true, // optional, default: true if `webhookFilteres` were provided, false otherwise
//   webhookFilters: [
//     codebuild.FilterGroup.inEventOf(codebuild.EventAction.PUSH).andBranchIs(
//       "main"
//     ),
//   ], // optional, by default all pushes and Pull Requests will trigger a build
// });

// // CODEBUILD - project
// const project = new codebuild.Project(this, "MyProject", {
//   projectName: `${this.stackName}`,
//   source: gitHubSource,
//   environment: {
//     buildImage: codebuild.LinuxBuildImage.AMAZON_LINUX_2_2,
//     privileged: true,
//   },
//   environmentVariables: {
//     CLUSTER_NAME: {
//       value: `${cluster.clusterName}`,
//     },
//     ECR_REPO_URI: {
//       value: `${ecrRepo.repositoryUri}`,
//     },
//   },
//   buildSpec: codebuild.BuildSpec.fromObject({
//     version: "0.2",
//     phases: {
//       pre_build: {
//         commands: [
//           "env",
//           "export TAG=${CODEBUILD_RESOLVED_SOURCE_VERSION}",
//         ],
//       },
//       build: {
//         commands: [
//           "cd flask-docker-app",
//           `docker build -t $ECR_REPO_URI:$TAG .`,
//           "$(aws ecr get-login --no-include-email)",
//           "docker push $ECR_REPO_URI:$TAG",
//         ],
//       },
//       post_build: {
//         commands: [
//           'echo "In Post-Build Stage"',
//           "cd ..",
//           'printf \'[{"name":"flask-app","imageUri":"%s"}]\' $ECR_REPO_URI:$TAG > imagedefinitions.json',
//           "pwd; ls -al; cat imagedefinitions.json",
//         ],
//       },
//     },
//     artifacts: {
//       files: ["imagedefinitions.json"],
//     },
//   }),
// });

// // ***PIPELINE ACTIONS***

// const sourceOutput = new codepipeline.Artifact();
// const buildOutput = new codepipeline.Artifact();
// const oauth = cdk.SecretValue.secretsManager("my-github-token");

// const sourceAction = new codepipeline_actions.GitHubSourceAction({
//   actionName: "GitHub_Source",
//   owner: "user-name",
//   repo: "amazon-ecs-fargate-cdk-cicd",
//   branch: "main",
//   oauthToken: oauth,
//   //oauthToken: cdk.SecretValue.plainText('<plain-text>'),
//   output: sourceOutput,
// });

// const buildAction = new codepipeline_actions.CodeBuildAction({
//   actionName: "CodeBuild",
//   project: project,
//   input: sourceOutput,
//   outputs: [buildOutput], // optional
// });

// const manualApprovalAction = new codepipeline_actions.ManualApprovalAction({
//   actionName: "Approve",
// });

// const deployAction = new codepipeline_actions.EcsDeployAction({
//   actionName: "DeployAction",
//   service: fargateService.service,
//   imageFile: new codepipeline.ArtifactPath(
//     buildOutput,
//     `imagedefinitions.json`
//   ),
// });

// // PIPELINE STAGES

// new codepipeline.Pipeline(this, "MyECSPipeline", {
//   stages: [
//     {
//       stageName: "Source",
//       actions: [sourceAction],
//     },
//     {
//       stageName: "Build",
//       actions: [buildAction],
//     },
//     {
//       stageName: "Approve",
//       actions: [manualApprovalAction],
//     },
//     {
//       stageName: "Deploy-to-ECS",
//       actions: [deployAction],
//     },
//   ],
// });

// ecrRepo.grantPullPush(project.role!);
// project.addToRolePolicy(
//   new iam.PolicyStatement({
//     actions: [
//       "ecs:DescribeCluster",
//       "ecr:GetAuthorizationToken",
//       "ecr:BatchCheckLayerAvailability",
//       "ecr:BatchGetImage",
//       "ecr:GetDownloadUrlForLayer",
//     ],
//     resources: [`${cluster.clusterArn}`],
//   })
// );

// //OUTPUT

// new cdk.CfnOutput(this, "LoadBalancerDNS", {
//   value: fargateService.loadBalancer.loadBalancerDnsName,
// });
//   }
// }
