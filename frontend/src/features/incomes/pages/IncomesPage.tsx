import React from 'react';
import { EntityManagement } from '../../../shared/components';
import { incomeEntityConfig } from '../entity.config';

const IncomesPage: React.FC = () => (
  <EntityManagement config={incomeEntityConfig} />
);

export default IncomesPage;
