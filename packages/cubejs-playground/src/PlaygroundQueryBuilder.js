import React from 'react';
import * as PropTypes from 'prop-types';
import {
  Row, Col, Divider, Card
} from 'antd';
import { QueryBuilder } from '@cubejs-client/react';
import { ChartRenderer } from './ChartRenderer';
import { playgroundAction } from './events';
import MemberGroup from './QueryBuilder/MemberGroup';
import FilterGroup from './QueryBuilder/FilterGroup';
import TimeGroup from './QueryBuilder/TimeGroup';
import SelectChartType from './QueryBuilder/SelectChartType';

const playgroundActionUpdateMethods = (updateMethods, memberName) => (
  Object.keys(updateMethods).map(method => ({
    [method]: (member, values, ...rest) => {
      let actionName = `${method.split('').map((c, i) => (i === 0 ? c.toUpperCase() : c)).join('')} Member`;
      if (values && values.values) {
        actionName = '更新过滤值';
      }
      if (values && values.dateRange) {
        actionName = '更新日期范围';
      }
      if (values && values.granularity) {
        actionName = '更新粒度';
      }
      playgroundAction(
        actionName,
        { memberName }
      );
      return updateMethods[method].apply(null, [member, values, ...rest]);
    }
  })).reduce((a, b) => ({ ...a, ...b }), {})
);

const PlaygroundQueryBuilder = ({
  query, cubejsApi, apiUrl, cubejsToken, dashboardSource, setQuery
}) => (
  <QueryBuilder
    query={query}
    setQuery={setQuery}
    cubejsApi={cubejsApi}
    render={({
      resultSet, error, validatedQuery, isQueryPresent, chartType, updateChartType,
      measures, availableMeasures, updateMeasures,
      dimensions, availableDimensions, updateDimensions,
      segments, availableSegments, updateSegments,
      filters, updateFilters,
      timeDimensions, availableTimeDimensions, updateTimeDimensions
    }) => [
      <Row type="flex" justify="space-around" align="top" gutter={24} style={{ marginBottom: 12 }} key="1">
        <Col span={24}>
          <Card>
            <Row type="flex" justify="space-around" align="top" gutter={24} style={{ marginBottom: 12 }}>
              <Col span={24}>
                <MemberGroup
                  members={measures}
                  availableMembers={availableMeasures}
                  addMemberName="指标"
                  updateMethods={playgroundActionUpdateMethods(updateMeasures, 'Measure')}
                />
                <Divider type="vertical"/>
                <MemberGroup
                  members={dimensions}
                  availableMembers={availableDimensions}
                  addMemberName="维度"
                  updateMethods={playgroundActionUpdateMethods(updateDimensions, 'Dimension')}
                />
                <Divider type="vertical"/>
                <MemberGroup
                  members={segments}
                  availableMembers={availableSegments}
                  addMemberName="Segment"
                  updateMethods={playgroundActionUpdateMethods(updateSegments, 'Segment')}
                />
                <Divider type="vertical"/>
                <TimeGroup
                  members={timeDimensions}
                  availableMembers={availableTimeDimensions}
                  addMemberName="时间"
                  updateMethods={playgroundActionUpdateMethods(updateTimeDimensions, 'Time')}
                />
              </Col>
            </Row>
            <Row type="flex" justify="space-around" align="top" gutter={24} style={{ marginBottom: 12 }}>
              <Col span={24}>
                <FilterGroup
                  members={filters}
                  availableMembers={availableDimensions.concat(availableMeasures)}
                  addMemberName="过滤"
                  updateMethods={playgroundActionUpdateMethods(updateFilters, 'Filter')}
                />
              </Col>
            </Row>
            <Row type="flex" justify="space-around" align="top" gutter={24}>
              <Col span={24}>
                <SelectChartType
                  chartType={chartType}
                  updateChartType={type => {
                    playgroundAction('更新图表类型');
                    updateChartType(type);
                  }}
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>,
      <Row type="flex" justify="space-around" align="top" gutter={24} key="2">
        <Col span={24}>
          {isQueryPresent ? (
            <ChartRenderer
              query={validatedQuery}
              resultSet={resultSet}
              error={error}
              apiUrl={apiUrl}
              cubejsToken={cubejsToken}
              chartType={chartType}
              cubejsApi={cubejsApi}
              dashboardSource={dashboardSource}
            />
          ) : <h2 style={{ textAlign: 'center' }}>选择一个指标或者维度开始</h2>}
        </Col>
      </Row>
    ]}
  />
);

PlaygroundQueryBuilder.propTypes = {
  query: PropTypes.object,
  setQuery: PropTypes.func,
  cubejsApi: PropTypes.object,
  dashboardSource: PropTypes.object,
  apiUrl: PropTypes.string,
  cubejsToken: PropTypes.string
};

PlaygroundQueryBuilder.defaultProps = {
  query: {},
  setQuery: null,
  cubejsApi: null,
  dashboardSource: null,
  apiUrl: '/cubejs-api/v1',
  cubejsToken: null
};

export default PlaygroundQueryBuilder;
