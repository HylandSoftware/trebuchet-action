# Trebuchet - Launch container images into Amazon ECR
[![Build Status](https://travis-ci.org/HylandSoftware/trebuchet.svg?branch=master)](https://travis-ci.org/HylandSoftware/trebuchet) [![Coverage Status](https://coveralls.io/repos/github/HylandSoftware/trebuchet/badge.svg?branch=master)](https://coveralls.io/github/HylandSoftware/trebuchet?branch=master) [![Go Report Card](https://goreportcard.com/badge/github.com/hylandsoftware/spot)](https://goreportcard.com/report/github.com/hylandsoftware/trebuchet)

![](logo/trebuchet_200x200.png)

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
          
      - uses: HylandSoftware/trebuchet-action@1.0.0
        with:
          action: copy
          source-account-id: ${{ secrets.SOURCE_ACCOUNT_ID }}
          source-role-arn: ${{ secrets.SOURCE_ROLE }}
          repository: ${{ secrets.REPOSITORY }}
          tag: ${{ secrets.TAG }}
```

