// @ts-strict-ignore
export const tryGetFromContext = (scope: any, env: any, contextKey: any) => {
  const envSpecific =
    scope.node.tryGetContext(env) && scope.node.tryGetContext(env)[contextKey];
  const value = envSpecific || '';
  if (typeof value === 'undefined')
    throw Error(
      `Error: Must specify value for ${contextKey} in environment ${env} or a default`
    );
  return value;
};

export const getTags = (
  domainName: string,
  ownerEmail = 'chenhaili001@gmail.com'
) => {
  return {
    Name: domainName,
    Owner: ownerEmail,
    TNService: 'Stock Intelligence',
    Group: 'Stock Intelligence',
    Product: 'Stock Intelligence',
  };
};

export const cdkContext = {
  product: {
    Environment: 'production',
    FinancialDataMetadataTable:
      'application-framework-data-stock-FinancialDataMetadata0B882B4D-118XZ0CEPWP0K',
  },
  uat: {
    Environment: 'uat',
    FinancialDataMetadataTable:
      'application-framework-data-stock-FinancialDataMetadata0B882B4D-118XZ0CEPWP0K',
  },
  stage: {
    Environment: 'stage',
    FinancialDataMetadataTable:
      'application-framework-data-stock-FinancialDataMetadata0B882B4D-118XZ0CEPWP0K',
  },
  dev: {
    Environment: 'dev',
    FinancialDataMetadataTable:
      'application-framework-data-stock-FinancialDataMetadata0B882B4D-118XZ0CEPWP0K',
  },
};
