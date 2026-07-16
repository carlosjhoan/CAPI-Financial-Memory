import React from 'react';
import { EntityManagement } from '../../../shared/components';
import { expenseEntityConfig } from '../entity.config';

const ExpensesPage: React.FC = () => (
  <EntityManagement config={expenseEntityConfig} />
);

export default ExpensesPage;
