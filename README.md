# ecommerce

## 1. design the infrastructure

#### 1.1 RDS: configure automatic network connectivity with an EC2 instance

```
VPC_ID=$(aws ec2 create-vpc --cidr-block 10.0.0.0/16 --query Vpc.VpcId --output text)

PUBLIC_SUBNET_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.1.0/24 --availability-zone us-east-1a --query Subnet.SubnetId --output text)

PRIVATE_SUBNET_ID=$(aws ec2 create-subnet --vpc-id $VPC_ID --cidr-block 10.0.2.0/24 --availability-zone us-east-1a --query Subnet.SubnetId --output text)
```

```
EC2_SG_ID=$(aws ec2 create-security-group --group-name ec2-sg --vpc-id $VPC_ID --query GroupId --output text)

RDS_SG_ID=$(aws ec2 create-security-group --group-name rds-sg --vpc-id $VPC_ID --query GroupId --output text)

aws ec2 authorize-security-group-ingress --group-id $RDS_SG_ID --protocol tcp --port 3306 --source-group $EC2_SG_ID
```

## 2. web application tier

#### 2.1 simple multi-tier web application

```
aws ec2 create-key-pair --key-name MyKeyPair --key-format pem --query "KeyMaterial" --output text > MyKeyPair.pem && chmod 400 MyKeyPair.pem

INSTANCE_ID=$(aws ec2 run-instances --image-id ami-09eb231ad55c3963d --instance-type t2.micro --subnet-id $PUBLIC_SUBNET_ID --associate-public-ip-address --key-name MyKeyPair --user-data file://my_script.txt --query "Instances[0].InstanceId" --output text)

PUBLIC_IP=$(aws ec2 describe-instances --instance-ids "$INSTANCE_ID" --query "Reservations[0].Instances[0].PublicIpAddress" --output text | tr '.' '-')

aws ec2 authorize-security-group-ingress --group-id "$EC2_SG_ID" --ip-permissions IpProtocol=tcp,FromPort=22,ToPort=22,IpRanges=[{CidrIp=0.0.0.0/0}] # RESTRICT THIS TO YOUR IP IN PRODUCTION!

aws ec2 authorize-security-group-ingress --group-id "$EC2_SG_ID" --ip-permissions IpProtocol=tcp,FromPort=5000,ToPort=5000,IpRanges=[{CidrIp=0.0.0.0/0}]

ssh -i MyKeyPair.pem ubuntu@ec2-$PUBLIC_IP.compute-1.amazonaws.com

git clone https://github.com/yunchengwong/ecommerce.git && cd ecommerce

sudo /home/ubuntu/.docker/cli-plugins/docker-compose up --detach
```

## 3. storage

#### 3.1 S3

```
aws s3api create-bucket --bucket ecommerce --acl private

git clone https://github.com/yunchengwong/ecommerce.git

aws s3 sync ecommerce s3://ecommerce

aws s3api put-public-access-block \
    --bucket ecommerce \
    --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

cat <<EOF > bucket-policy.json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadForProducts",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::ecommerce/products/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy --bucket ecommerce --policy file://bucket-policy.json
```

#### 3.2 RDS

| product_name              | description | price | image_url |
|---------------------------|-------------|-------|-----------|
| Nike P-6000 SE            | A mash-up of past Pegasus sneakers, the P-6000 takes early-2000s running to modern heights. It mixes leather, textile and suede for a layered look built to last. Plus, its foam cushioning adds a lifted, athletics inspired stance and unbelievable comfort. This version is part of the Bowerman series—a collection honouring the legacy of Coach Bill Bowerman. | 339 | https://ecommerce.s3.us-east-1.amazonaws.com/products/20250609161243.jpg |
| Air Jordan 4 RM           | These sneakers reimagine the instantly recognisable AJ4 for life on the go. We centred comfort and durability while keeping the heritage look you love. Max Air in the heel cushions your every step, and elements of the upper—the wing, eyestay and heel—are blended into a strong, flexible cage that wraps the shoe to add a toughness to your everyday commute. | 419 | https://ecommerce.s3.us-east-1.amazonaws.com/products/20250609161328.jpg |
| Air Jordan Legacy 312 Low | Celebrate MJ's legacy with this shout-out to Chicago's 312 area code. With elements from three iconic Jordans (the AJ3, AJ1 and Air Alpha Force), it's a modern mash-up that reps the best. | 399 | https://ecommerce.s3.us-east-1.amazonaws.com/products/20250609161344.jpg |
