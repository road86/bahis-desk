import * as React from 'react';
import { Button, Col, Container, Row } from 'reactstrap';

/** type of fieldParentTreeName */
export type FieldParentTreeName = string;

/** interface for bind property */
interface BindProperty {
  calculate?: string;
  relevant?: string;
  readonly?: string;
  appearance?: string;
  required?: string;
  constraint?: string;
  'jr:constraintMsg'?: { [key: string]: string } | string;
}

/** interface for kobo field element */
export interface FieldElement {
  name: string;
  type: string;
  children?: any[];
  bind?: BindProperty;
  label?: { [key: string]: string } | string;
  default?: any;
  control?: any;
  hint?: any;
}

/** props interface for BaseTypeEvaluator component */
export interface BaseTypeEvaluatorProps {
  defaultLanguage: string;
  fieldElement: FieldElement;
}

class BaseTypeEvaluator extends React.Component<BaseTypeEvaluatorProps> {
  public render() {
    const { fieldElement, defaultLanguage } = this.props;
    return this.typeEvaluator(fieldElement, defaultLanguage);
  }

  /** returns jsx components based on field types
   * @param {FieldElement} fieldElement - the field element object
   * @param {FieldParentTreeName} fieldParentTreeName - the field parent hierchical name
   * @return {React.ReactElement} - jsx base components
   */
  private typeEvaluator(fieldElement: FieldElement, defaultLanguage: string): React.ReactElement {
    return (
      <Container>
        <Row id="sub-page-row">
          <Col>
            <div
              className="col-md-4"
              style={{
                backgroundColor: 'green',
                border: '1px solid black',
                height: 100,
                margin: 5,
              }}
            >
              {fieldElement.type} {fieldElement.name}
            </div>
          </Col>
        </Row>
      </Container>
    );
  }
}

export default BaseTypeEvaluator;
