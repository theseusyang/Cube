import React from 'react';
import {
  Table, Icon, Tabs
} from 'antd';
import { QueryRenderer } from '@cubejs-client/react';
import sqlFormatter from "sql-formatter";
import PropTypes from 'prop-types';
import PrismCode from '../PrismCode';

const CachePane = ({ query, cubejsApi }) => (
  <QueryRenderer
    loadSql
    query={{ ...query, renewQuery: true }}
    cubejsApi={cubejsApi}
    render={
      ({ sqlQuery, resultSet: rs }) => (
        <Tabs
          defaultActiveKey="refreshKeys"
          tabBarExtraContent={(
            <span>
              Last Refresh Time:&nbsp;
              <b>{rs && rs.loadResponse.lastRefreshTime}</b>
            </span>
          )}
        >
          <Tabs.TabPane tab="刷新键" key="refreshKeys">
            <Table
              loading={!sqlQuery}
              pagination={false}
              scroll={{ x: true }}
              columns={[
                {
                  title: '刷新键 SQL',
                  key: 'refreshKey',
                  render: (text, record) => <PrismCode code={sqlFormatter.format(record[0])} />,
                },
                {
                  title: '值',
                  key: 'value',
                  render: (text, record) => (
                    <PrismCode
                      code={
                        rs && rs.loadResponse.refreshKeyValues
                        && JSON.stringify(rs.loadResponse.refreshKeyValues[
                          sqlQuery.sqlQuery.sql.cacheKeyQueries.queries.indexOf(record)
                        ], null, 2)
                      }
                    />
                  ),
                }
              ]}
              dataSource={
                sqlQuery && sqlQuery.sqlQuery.sql && sqlQuery.sqlQuery.sql.cacheKeyQueries.queries
              }
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="Pre-aggregations" key="preAggregations">
            <Table
              loading={!sqlQuery}
              pagination={false}
              scroll={{ x: true }}
              columns={[
                {
                  title: '表名',
                  key: 'tableName',
                  dataIndex: 'tableName',
                  render: (text) => <b>{text}</b>
                },
                {
                  title: '刷新键 SQL',
                  key: 'refreshKey',
                  dataIndex: 'invalidateKeyQueries',
                  render: (refreshKeyQueries) => refreshKeyQueries
                    .map(q => <PrismCode key={q[0]} code={sqlFormatter.format(q[0])} />),
                },
                {
                  title: '刷新键值',
                  key: 'value',
                  render: (text, record) => rs && rs.loadResponse.usedPreAggregations
                    && rs.loadResponse.usedPreAggregations[record.tableName].refreshKeyValues.map(k => (
                      <PrismCode
                        key={JSON.stringify(k)}
                        code={JSON.stringify(k, null, 2)}
                      />
                    )),
                }
              ]}
              dataSource={
                sqlQuery && sqlQuery.sqlQuery.sql && sqlQuery.sqlQuery.sql.preAggregations
              }
            />
          </Tabs.TabPane>
          <Tabs.TabPane tab="上卷匹配结果" key="rollupMatchResults">
            <Table
              loading={!sqlQuery}
              pagination={false}
              scroll={{ x: true }}
              columns={[
                {
                  title: '上卷表名',
                  key: 'tableName',
                  dataIndex: 'tableName',
                  render: (text) => <b>{text}</b>
                },
                {
                  title: '上卷定义',
                  key: 'rollup',
                  dataIndex: 'references',
                  render: (text) => <PrismCode code={JSON.stringify(text, null, 2)} />,
                },
                {
                  title: '可以使用',
                  key: 'canUsePreAggregation',
                  dataIndex: 'canUsePreAggregation',
                  render: (text) => (
                    text ? <Icon type="check" style={{ color: '#52c41a', fontSize: '2em' }}/>
                      : <Icon type="close" style={{ color: '#c2371b', fontSize: '2em' }}/>
                  ),
                }
              ]}
              dataSource={
                sqlQuery && sqlQuery.sqlQuery.sql && sqlQuery.sqlQuery.sql.rollupMatchResults
              }
            />
          </Tabs.TabPane>
        </Tabs>
      )}
  />
);

CachePane.propTypes = {
  query: PropTypes.object.isRequired,
  cubejsApi: PropTypes.object.isRequired
};

export default CachePane;
