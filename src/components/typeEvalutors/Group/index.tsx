import * as React from 'react';
import BaseTypeEvaluator, { FieldElement } from '../Base';

/** props Interface for the GroupTypeEvaluator component */
export interface GroupTypeEvaluatorProps {
  defaultLanguage: string;
  fieldElements: FieldElement[];
}

class GroupTypeEvaluator extends React.Component<GroupTypeEvaluatorProps> {
  public render() {
    const { fieldElements, defaultLanguage } = this.props;
    return (
      <div>
        {fieldElements.map(fieldElement => (
          <div key={'group_' + fieldElement.name}>
            {this.typeEvaluator(fieldElement, defaultLanguage)}
          </div>
        ))}
      </div>
    );
  }

  /** returns jsx components based on field types
   * @param {FieldElement} fieldElement - the field element object
   * @param {FieldParentTreeName} - the field parent hierarchical name
   * @return {React.ReactElement} - jsx group components/ base evaluator component
   */
  private typeEvaluator(fieldElement: FieldElement, defaultLanguage: string): React.ReactElement {
    return <BaseTypeEvaluator fieldElement={fieldElement} defaultLanguage={defaultLanguage} />;
  }
}

export default GroupTypeEvaluator;
