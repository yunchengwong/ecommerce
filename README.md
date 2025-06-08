# ecommerce

#### 1. application development

prompt: develop a simple multi-tier web application, frontend in python/flask, and backend in nodejs/express, frontend should be able to access to backend through docker network

testing locally: success

testing on AWS EC2: success

#### 2. containerize application

prompt: create a GitLab CI/CD pipeline to containerize the application and push to AWS public docker repository

access denied: learner lab account is not authorized to create user or to access resource: root access management

```
aws iam create-user --user-name gitlab-ci-user
aws iam attach-user-policy --user-name gitlab-ci-user --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser
aws iam create-access-key --user-name gitlab-ci-user --query 'AccessKey.{AccessKeyId:AccessKeyId,SecretAccessKey:SecretAccessKey}' --output text
```

prompt: containerize the application locally and push to AWS public docker repository

result: 