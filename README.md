# ecommerce

\<ARCHITECTURE DIAGRAM USING MIRO>

## 1. design the infrastructure

#### 1.1 VPC with public and private subnets

Option 1: Create VPC in Console:

- Create VPC
    - Resources to create: VPC and more
    - Number of availability zones (AZs): 2
    - Number of public subnets: 2
    - Number of private subnets: 4
    - NAT gatways: None
    - VPC endpoints: None
- Edit Subnet
    - `project-subnet-public1-us-east-1a`: Enable auto-assign public IPv4 address
    - `project-subnet-public2-us-east-1b`: Enable auto-assign public IPv4 address

OR

Option 2: Create VPC using CLI:

```
# Create VPC
VPC_ID=$(aws ec2 create-vpc --cidr-block "10.0.0.0/16" --tag-specifications '{"resourceType":"vpc","tags":[{"key":"Name","value":"project-vpc"}]}' --query 'Vpc.VpcId' --output text)

# Create Public Subnet 1 for ALB (us-east-1a)
PUBLIC_1A=$(aws ec2 create-subnet --vpc-id "$VPC_ID" --cidr-block "10.0.0.0/20" --availability-zone "us-east-1a" --tag-specifications '{"resourceType":"subnet","tags":[{"key":"Name","value":"project-subnet-public1-us-east-1a"}]}' --query 'Subnet.SubnetId' --output text)

aws ec2 modify-subnet-attribute --subnet-id "$PUBLIC_1A" --map-public-ip-on-launch

# Create Public Subnet 2 for ALB (us-east-1b)
PUBLIC_2B=$(aws ec2 create-subnet --vpc-id "$VPC_ID" --cidr-block "10.0.16.0/20" --availability-zone "us-east-1b" --tag-specifications '{"resourceType":"subnet","tags":[{"key":"Name","value":"project-subnet-public2-us-east-1b"}]}' --query 'Subnet.SubnetId' --output text) 

aws ec2 modify-subnet-attribute --subnet-id "$PUBLIC_2B" --map-public-ip-on-launch

# Create Private Subnet 1 for EC2 (us-east-1a)
PRIVATE_1A=$(aws ec2 create-subnet --vpc-id "$VPC_ID" --cidr-block "10.0.128.0/20" --availability-zone "us-east-1a" --tag-specifications '{"resourceType":"subnet","tags":[{"key":"Name","value":"project-subnet-private1-us-east-1a"}]}' --query 'Subnet.SubnetId' --output text)

# Create Private Subnet 2 for EC2 (us-east-1b)
PRIVATE_2B=$(aws ec2 create-subnet --vpc-id "$VPC_ID" --cidr-block "10.0.144.0/20" --availability-zone "us-east-1b"  --tag-specifications '{"resourceType":"subnet","tags":[{"key":"Name","value":"project-subnet-private2-us-east-1b"}]}' --query 'Subnet.SubnetId' --output text)

# Create Private Subnet 3 for RDS (us-east-1a)
PRIVATE_3A=$(aws ec2 create-subnet --vpc-id "$VPC_ID" --cidr-block "10.0.160.0/20" --availability-zone "us-east-1a" --tag-specifications '{"resourceType":"subnet","tags":[{"key":"Name","value":"project-subnet-private3-us-east-1a"}]}' --query 'Subnet.SubnetId' --output text)

# Create Private Subnet 4 for RDS (us-east-1b)
PRIVATE_4B=$(aws ec2 create-subnet --vpc-id "$VPC_ID" --cidr-block "10.0.176.0/20" --availability-zone "us-east-1b" --tag-specifications '{"resourceType":"subnet","tags":[{"key":"Name","value":"project-subnet-private4-us-east-1b"}]}' --query 'Subnet.SubnetId' --output text)

# Create Internet Gateway
IGW_ID=$(aws ec2 create-internet-gateway --tag-specifications '{"resourceType":"internet-gateway","tags":[{"key":"Name","value":"project-igw"}]}' --query 'InternetGateway.InternetGatewayId' --output text)

# Attach Internet Gateway to VPC
aws ec2 attach-internet-gateway --internet-gateway-id "$IGW_ID" --vpc-id "$VPC_ID"

# Create Route Table for Public Subnets
ROUTE_TABLE_PUBLIC=$(aws ec2 create-route-table --vpc-id "$VPC_ID" --tag-specifications '{"resourceType":"route-table","tags":[{"key":"Name","value":"project-rtb-public"}]}' --query 'RouteTable.RouteTableId' --output text)

# Create Route for Public Subnets
aws ec2 create-route --route-table-id "$ROUTE_TABLE_PUBLIC" --destination-cidr-block "0.0.0.0/0" --gateway-id "$IGW_ID" 

# Associate Route Table with Public Subnets
aws ec2 associate-route-table --route-table-id "$ROUTE_TABLE_PUBLIC" --subnet-id "$PUBLIC_1A"

aws ec2 associate-route-table --route-table-id "$ROUTE_TABLE_PUBLIC" --subnet-id "$PUBLIC_2B"

# Create Route Table for Private Subnet 1 (us-east-1a)
ROUTE_TABLE_PRIVATE_1=$(aws ec2 create-route-table --vpc-id "$VPC_ID" --tag-specifications '{"resourceType":"route-table","tags":[{"key":"Name","value":"project-rtb-private1-us-east-1a"}]}' --query 'RouteTable.RouteTableId' --output text)

aws ec2 associate-route-table --route-table-id "$ROUTE_TABLE_PRIVATE_1" --subnet-id "$PRIVATE_1A"

# Create Route Table for Private Subnet 2 (us-east-1b)
ROUTE_TABLE_PRIVATE_2=$(aws ec2 create-route-table --vpc-id "$VPC_ID" --tag-specifications '{"resourceType":"route-table","tags":[{"key":"Name","value":"project-rtb-private2-us-east-1b"}]}' --query 'RouteTable.RouteTableId' --output text)

aws ec2 associate-route-table --route-table-id "$ROUTE_TABLE_PRIVATE_2" --subnet-id "$PRIVATE_2B"

# Create Route Table for Private Subnet 3 (us-east-1a)
ROUTE_TABLE_PRIVATE_3=$(aws ec2 create-route-table --vpc-id "$VPC_ID" --tag-specifications '{"resourceType":"route-table","tags":[{"key":"Name","value":"project-rtb-private3-us-east-1a"}]}' --query 'RouteTable.RouteTableId' --output text)

aws ec2 associate-route-table --route-table-id "$ROUTE_TABLE_PRIVATE_3" --subnet-id "$PRIVATE_3A"

# Create Route Table for Private Subnet 4 (us-east-1b)
ROUTE_TABLE_PRIVATE_4=$(aws ec2 create-route-table --vpc-id "$VPC_ID" --tag-specifications '{"resourceType":"route-table","tags":[{"key":"Name","value":"project-rtb-private4-us-east-1b"}]}' --query 'RouteTable.RouteTableId' --output text)

aws ec2 associate-route-table --route-table-id "$ROUTE_TABLE_PRIVATE_4" --subnet-id "$PRIVATE_4B"
```

#### 1.2 security groups

```
# Create Security Group for ALB
ALB_SG_ID=$(aws ec2 create-security-group --group-name group-alb --vpc-id "$VPC_ID" --description "security group for ALB" --query GroupId --output text)

# Allow HTTPS (port 443) from Anywhere to ALB
aws ec2 authorize-security-group-ingress --group-id "$ALB_SG_ID" --protocol tcp --port 443 --cidr 0.0.0.0/0

# Create Security Group for EC2
EC2_SG_ID=$(aws ec2 create-security-group --group-name group-ec2 --vpc-id $VPC_ID --description "security group for EC2" --query GroupId --output text)

# Allow HTTP (port 80) from ALB Security Group to EC2
aws ec2 authorize-security-group-ingress --group-id "$EC2_SG_ID" --protocol tcp --port 80 --source-group "$ALB_SG_ID"

# aws ec2 authorize-security-group-ingress --group-id "$EC2_SG_ID" --protocol tcp --port 22 --cidr 0.0.0.0/0

# Create Security Group for RDS
RDS_SG_ID=$(aws ec2 create-security-group --group-name group-rds --vpc-id $VPC_ID --description "security group for RDS" --query GroupId --output text)

# Allow MySQL (port 3306) from EC2 Security Group to RDS
aws ec2 authorize-security-group-ingress --group-id "$RDS_SG_ID" --protocol tcp --port 3306 --source-group "$EC2_SG_ID"
```

## 2. application

- simple multi-tier web application (frontend, backend)
- containerize using docker (docker-compose.yml)
- deploy on EC2 instance (my-script.txt)

## 3. storage

#### 3.1 S3 storing products images

```
aws s3api create-bucket --bucket ecommerce-156422111001 --region us-east-1

git clone https://github.com/yunchengwong/ecommerce.git

aws s3 sync ecommerce/products s3://ecommerce-156422111001/products

aws s3api put-public-access-block \
    --bucket ecommerce-156422111001 \
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
            "Resource": "arn:aws:s3:::ecommerce-156422111001/products/*"
        }
    ]
}
EOF

aws s3api put-bucket-policy --bucket ecommerce-156422111001 --policy file://bucket-policy.json
```

#### 3.2 RDS storing product listings

| product_name              | description | price | image_url |
|---------------------------|-------------|-------|-----------|
| Nike P-6000 SE            | A mash-up of past Pegasus sneakers, the P-6000 takes early-2000s running to modern heights. It mixes leather, textile and suede for a layered look built to last. Plus, its foam cushioning adds a lifted, athletics inspired stance and unbelievable comfort. This version is part of the Bowerman series—a collection honouring the legacy of Coach Bill Bowerman. | 339 | https://ecommerce-7016.s3.us-east-1.amazonaws.com/products/20250609161243.jpg |
| Air Jordan 4 RM           | These sneakers reimagine the instantly recognisable AJ4 for life on the go. We centred comfort and durability while keeping the heritage look you love. Max Air in the heel cushions your every step, and elements of the upper—the wing, eyestay and heel—are blended into a strong, flexible cage that wraps the shoe to add a toughness to your everyday commute. | 419 | https://ecommerce-7016.s3.us-east-1.amazonaws.com/products/20250609161328.jpg |
| Air Jordan Legacy 312 Low | Celebrate MJ's legacy with this shout-out to Chicago's 312 area code. With elements from three iconic Jordans (the AJ3, AJ1 and Air Alpha Force), it's a modern mash-up that reps the best. | 399 | https://ecommerce-7016.s3.us-east-1.amazonaws.com/products/20250609161344.jpg |

```
aws rds create-db-subnet-group \
    --db-subnet-group-name mysubnetgroup \
    --db-subnet-group-description "test DB subnet group" \
    --subnet-ids $PRIVATE_3A $PRIVATE_4B 

aws rds create-db-instance \
    --engine mysql \
    --engine-version 8.0.32 \
    --no-multi-az \
    --db-instance-identifier database-1 \
    --master-username admin \
    --master-user-password "YourStrongPassword123!" \
    --db-instance-class db.t4g.micro \
    --storage-type gp2 \
    --allocated-storage 20 \
    --db-subnet-group-name mysubnetgroup \
    --no-publicly-accessible \
    --vpc-security-group-ids "$RDS_SG_ID" \
    --db-name products \
    --no-storage-encrypted

# WAIT FOR 5 MINUTES

ENDPOINT=$(aws rds describe-db-instances \
    --db-instance-identifier database-1 \
    --query 'DBInstances[0].Endpoint.Address' --output text)

sed -i "s/endpoint/$ENDPOINT/g" my-script.txt
```

## 4. load balancing

#### 4.1 application load balancer

```
TG_ARN=$(aws elbv2 create-target-group \
    --name my-targets \
    --protocol HTTP \
    --port 80 \
    --target-type instance \
    --vpc-id "$VPC_ID" \
    --query 'TargetGroups[0].TargetGroupArn' --output text)

ALB_ARN=$(aws elbv2 create-load-balancer \
    --name my-load-balancer \
    --subnets $PUBLIC_1A $PUBLIC_2B \
    --security-groups $ALB_SG_ID \
    --query 'LoadBalancers[0].LoadBalancerArn' --output text)

openssl req -x509 -newkey rsa:2048 -keyout demo.key -out demo.crt -days 365 -nodes \
  -subj "/CN=example.com"

cat demo.crt demo.key > demo-combined.pem

aws acm import-certificate \
  --certificate fileb://demo.crt \
  --private-key fileb://demo.key \
  --certificate-chain fileb://demo.crt \
  --region us-east-1 

aws elbv2 create-listener \
    --load-balancer-arn "$ALB_ARN" \
    --protocol HTTPS \
    --port 443 \
    --certificates CertificateArn="$CERT_ARN" \
    --ssl-policy ELBSecurityPolicy-2016-08 \
    --default-actions Type=forward,TargetGroupArn="$TG_ARN"
```

#### 4.2 auto scaling group

```
mv ecommerce/my_script.txt .

USER_DATA_B64=$(base64 -w 0 my_script.txt)

LAUNCH_TEMPLATE_ID=$(aws ec2 create-launch-template \
    --launch-template-name TemplateForAutoScaling \
    --launch-template-data '{"NetworkInterfaces": [{"DeviceIndex": 0, "Groups": ["'"$EC2_SG_ID"'"]}], "ImageId": "ami-09eb231ad55c3963d", "InstanceType": "t2.micro", "UserData": "'"$USER_DATA_B64"'"}' \
    --region us-east-1 \
    --query 'LaunchTemplate.LaunchTemplateId' --output text)

aws autoscaling create-auto-scaling-group \
    --auto-scaling-group-name my-asg \
    --launch-template LaunchTemplateId="$LAUNCH_TEMPLATE_ID",Version='$Latest' \
    --target-group-arns "$TG_ARN" \
    --health-check-type ELB --health-check-grace-period 600 \
    --min-size 1 --max-size 2 \
    --vpc-zone-identifier "$PRIVATE_1A,$PRIVATE_2B" \
    --region us-east-1

ALB_PARTS=$(echo "$ALB_ARN" | sed -n 's/.*loadbalancer\/app\/\(.*\)/\1/p')
ALB_NAME=$(echo "$ALB_PARTS" | cut -d'/' -f1)
ALB_ID=$(echo "$ALB_PARTS" | cut -d'/' -f2)
TG_PARTS=$(echo "$TG_ARN" | sed -n 's/.*targetgroup\/\(.*\)/\1/p')
TG_NAME=$(echo "$TG_PARTS" | cut -d'/' -f1)
TG_ID=$(echo "$TG_PARTS" | cut -d'/' -f2)

cat <<EOF > config.json
{
    "PredefinedMetricSpecification": {
        "PredefinedMetricType": "ALBRequestCountPerTarget",
        "ResourceLabel": "app/$ALB_NAME/$ALB_ID/targetgroup/$TG_NAME/$TG_ID"
    },
    "TargetValue": 100,
    "DisableScaleIn": false
}
EOF

aws autoscaling put-scaling-policy \
    --policy-name alb50-target-tracking-scaling-policy  \
    --auto-scaling-group-name my-asg \
    --policy-type TargetTrackingScaling \
    --target-tracking-configuration file://config.json
```
