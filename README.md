# Trebuchet Action - Launch container images into Amazon ECR
----

The purpose of Trebuchet is to improve the quality of life for pushing Docker images to Amazon Elastic Container Registry (ECR).

## Usage
`Trebuchet-Action` is a public GitHub action that can be used in any GitHub action pipeline.

```
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.DESTINATION_AWS_ACCESS_KEY_ID}}
          aws-secret-access-key: ${{ secrets.DESTINATION_AWS_SECRET_KEY }}
          aws-region: us-east-1
          role-to-assume: ${{ secrets.DESTINATION_ROLE }}
          role-skip-session-tagging: true
          mask-aws-account-id: false
          role-duration-seconds: 900

      - uses: HylandSoftware/trebuchet-action@v1
        with:
          action: copy
          source-account-id: ${{ secrets.SOURCE_ACCOUNT_ID }}
          source-role-arn: ${{ secrets.SOURCE_ROLE }}
          repository: ${{ secrets.REPOSITORY }}
          tag: ${{ secrets.TAG }}
```

| Paramater | Required | Default | Description |
| ---------- | ------- | ------- | ----------- |
| action | true | n/a | The command to execute, `push` or `copy` are the currently supported actions. |
| repository | true | n/a | The name of the image in either the local docker or remote registry. |
| tag | true | n/a | The tag of the image to use when performing the action. |
| region | false | ENV_VAR | The AWS region to execute against.  It will use this property or pull from the AWS_DEFAULT_REGION Environment variable. |
| source-account-id | false | CURRENT_ACCOUNT | The account id of the source AWS account for a pull / copy, if different than the default account id. |
| source-role-arn | false  | CURRENT_ACCOUNT | The role arn to use when pulling the image from ECR.  Only needed when the source role is different from the default environment credentials. |
| immutable | false | false | Whether the repository should be created as IMMUTABLE (if not already existing) |
