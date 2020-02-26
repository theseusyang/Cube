/* global navigator */
import React from 'react';
import {
  Card, Button, Menu, Dropdown, Icon, notification, Modal, Table
} from 'antd';
import { getParameters } from 'codesandbox-import-utils/lib/api/define';
import { fetch } from 'whatwg-fetch';
import { map } from 'ramda';
import { Redirect, withRouter } from 'react-router-dom';
import { QueryRenderer } from '@cubejs-client/react';
import sqlFormatter from "sql-formatter";
import PropTypes from 'prop-types';
import PrismCode from './PrismCode';
import CachePane from './components/CachePane';
import { playgroundAction } from './events';

export const frameworks = [{
  id: 'vanilla',
  title: 'Vanilla JavaScript',
  docsLink: 'https://cube.dev/docs/@cubejs-client-core'
}, {
  id: 'react',
  title: 'React'
}, {
  id: 'angular',
  title: 'Angular',
  docsLink: 'https://cube.dev/docs/@cubejs-client-ngx'
}, {
  id: 'vue',
  title: 'Vue.js',
  docsLink: 'https://cube.dev/docs/@cubejs-client-vue'
}];

class ChartContainer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showCode: false,
      framework: 'react'
    };
  }

  async componentDidMount() {
    const {
      codeSandboxSource,
      dependencies
    } = this.props;
    const codeSandboxRes = await fetch("https://codesandbox.io/api/v1/sandboxes/define?json=1", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify(this.codeSandboxDefinition(codeSandboxSource, dependencies))
    });
    const codeSandboxJson = await codeSandboxRes.json();
    this.setState({ sandboxId: codeSandboxJson.sandbox_id });
  }

  codeSandboxDefinition(codeSandboxSource, dependencies) {
    return {
      files: {
        ...(typeof codeSandboxSource === 'string' ? {
          'index.js': {
            content: codeSandboxSource,
          }
        } : codeSandboxSource),
        'package.json': {
          content: {
            dependencies: {
              'react-dom': 'latest',
              ...map(() => 'latest', dependencies)
            }
          },
        },
      },
      template: 'create-react-app'
    };
  }

  render() {
    const {
      redirectToDashboard, showCode, sandboxId, addingToDashboard, framework
    } = this.state;
    const {
      resultSet,
      error,
      codeExample,
      render,
      codeSandboxSource,
      dependencies,
      dashboardSource,
      hideActions,
      query,
      cubejsApi,
      chartLibrary,
      setChartLibrary,
      chartLibraries,
      history
    } = this.props;

    if (redirectToDashboard) {
      return <Redirect to="/dashboard" />;
    }

    const parameters = getParameters(this.codeSandboxDefinition(codeSandboxSource, dependencies));

    const chartLibrariesMenu = (
      <Menu
        onClick={(e) => {
          playgroundAction('设置图表库', { chartLibrary: e.key });
          setChartLibrary(e.key);
        }}
      >
        {
          chartLibraries.map(library => (
            <Menu.Item key={library.value}>
              {library.title}
            </Menu.Item>
          ))
        }
      </Menu>
    );

    const frameworkMenu = (
      <Menu
        onClick={(e) => {
          playgroundAction('设置框架', { framework: e.key });
          this.setState({ framework: e.key });
        }}
      >
        {
          frameworks.map(f => (
            <Menu.Item key={f.id}>
              {f.title}
            </Menu.Item>
          ))
        }
      </Menu>
    );

    const currentLibraryItem = chartLibraries.find(m => m.value === chartLibrary);
    const frameworkItem = frameworks.find(m => m.id === framework);
    const extra = (
      <form action="https://codesandbox.io/api/v1/sandboxes/define" method="POST" target="_blank">
        <input type="hidden" name="parameters" value={parameters} />
        <Button.Group>
          {dashboardSource && (
            <Button
              onClick={async () => {
                this.setState({ addingToDashboard: true });
                const canAddChart = await dashboardSource.canAddChart();
                if (typeof canAddChart === 'boolean' && canAddChart) {
                  playgroundAction('添加到仪表盘');
                  await dashboardSource.addChart(codeExample);
                  this.setState({ redirectToDashboard: true, addingToDashboard: false });
                } else if (!canAddChart) {
                  this.setState({ addingToDashboard: false });
                  Modal.error({
                    title: '你的仪表盘不支持添加静态图表',
                    content: '请使用静态仪表盘模板'
                  });
                } else {
                  this.setState({ addingToDashboard: false });
                  Modal.error({
                    title: '加载仪表盘发生错误',
                    content: canAddChart,
                    okText: 'Fix',
                    okCancel: true,
                    onOk() {
                      history.push('/dashboard');
                    }
                  });
                }
              }}
              icon="plus"
              size="small"
              loading={addingToDashboard}
              disabled={!!frameworkItem.docsLink}
            >
              {addingToDashboard ? '正在准备仪表盘. 稍等片刻. 请检查进度...' : '添加到仪表盘'}
            </Button>
          )}
          <Dropdown overlay={frameworkMenu}>
            <Button size="small">
              {frameworkItem && frameworkItem.title}
              <Icon type="down" />
            </Button>
          </Dropdown>
          <Dropdown
            overlay={chartLibrariesMenu}
            disabled={!!frameworkItem.docsLink}
          >
            <Button
              size="small"
            >
              {currentLibraryItem && currentLibraryItem.title}
              <Icon type="down" />
            </Button>
          </Dropdown>
          <Button
            onClick={() => {
              playgroundAction('显示查询');
              this.setState({ showCode: showCode === 'query' ? null : 'query' });
            }}
            icon="thunderbolt"
            size="small"
            type={showCode === 'query' ? 'primary' : 'default'}
            disabled={!!frameworkItem.docsLink}
          >
            JSON Query
          </Button>
          <Button
            onClick={() => {
              playgroundAction('显示代码');
              this.setState({ showCode: showCode === 'code' ? null : 'code' });
            }}
            icon="code"
            size="small"
            type={showCode === 'code' ? 'primary' : 'default'}
            disabled={!!frameworkItem.docsLink}
          >
            Code
          </Button>
          <Button
            onClick={() => {
              playgroundAction('显示 SQL');
              this.setState({ showCode: showCode === 'sql' ? null : 'sql' });
            }}
            icon="question-circle"
            size="small"
            type={showCode === 'sql' ? 'primary' : 'default'}
            disabled={!!frameworkItem.docsLink}
          >
            SQL
          </Button>
          <Button
            onClick={() => {
              playgroundAction('显示 Cache');
              this.setState({ showCode: showCode === 'cache' ? null : 'cache' });
            }}
            icon="sync"
            size="small"
            type={showCode === 'cache' ? 'primary' : 'default'}
            disabled={!!frameworkItem.docsLink}
          >
            Cache
          </Button>
          <Button
            icon="code-sandbox"
            size="small"
            onClick={() => playgroundAction('打开代码沙盒')}
            htmlType="submit"
            disabled={!!frameworkItem.docsLink}
          >
            Edit
          </Button>
        </Button.Group>
      </form>
    );

    const queryText = JSON.stringify(query, null, 2);

    const renderChart = () => {
      if (frameworkItem && frameworkItem.docsLink) {
        return (
          <h2 style={{ padding: 24, textAlign: 'center' }}>
            We do not support&nbsp;
            {frameworkItem.title}
            &nbsp;code generation here yet.
            < br/>
            Please refer to&nbsp;
            <a
              href={frameworkItem.docsLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => playgroundAction('Unsupported Framework Docs', { framework })}
            >
              {frameworkItem.title}
              &nbsp;docs
            </a>
            &nbsp;to see on how to use it with Cube.js.
          </h2>
        );
      } else if (showCode === 'code') {
        return <PrismCode code={codeExample} />;
      } else if (showCode === 'query') {
        return <PrismCode code={queryText} />;
      } else if (showCode === 'sql') {
        return (
          <QueryRenderer
            loadSql="only"
            query={query}
            cubejsApi={cubejsApi}
            render={({ sqlQuery }) => <PrismCode code={sqlQuery && sqlFormatter.format(sqlQuery.sql())} />}
          />
        );
      } else if (showCode === 'cache') {
        return (
          <CachePane
            query={query}
            cubejsApi={cubejsApi}
          />
        );
      }
      return render({ resultSet, error, sandboxId });
    };

    let title;

    const copyCodeToClipboard = async () => {
      if (!navigator.clipboard) {
        notification.error({
          message: `Your browser doesn't support copy to clipboard`
        });
      }
      try {
        await navigator.clipboard.writeText(showCode === 'query' ? queryText : codeExample);
        notification.success({
          message: `成功复制到粘贴板`
        });
      } catch (e) {
        notification.error({
          message: `不能复制到粘贴板`,
          description: e,
        });
      }
    };

    if (showCode === 'code') {
      title = (
        <Button
          icon="copy"
          onClick={() => {
            copyCodeToClipboard();
            playgroundAction('拷贝代码到粘贴板');
          }}
          type="primary"
        >
          Copy Code to Clipboard
        </Button>
      );
    } else if (showCode === 'query') {
      title = (
        <Button
          icon="copy"
          onClick={() => {
            copyCodeToClipboard();
            playgroundAction('拷贝查询到粘贴板');
          }}
          type="primary"
        >
          Copy Query to Clipboard
        </Button>
      );
    } else if (showCode === 'sql') {
      title = 'SQL';
    } else {
      title = '图表';
    }

    return hideActions ? render({ resultSet, error, sandboxId }) : (
      <Card
        title={title}
        style={{ minHeight: 420 }}
        extra={extra}
      >
        {renderChart()}
      </Card>
    );
  }
}

ChartContainer.propTypes = {
  resultSet: PropTypes.object,
  error: PropTypes.object,
  codeExample: PropTypes.string,
  render: PropTypes.func.isRequired,
  codeSandboxSource: PropTypes.string,
  dependencies: PropTypes.object.isRequired,
  dashboardSource: PropTypes.object,
  hideActions: PropTypes.array,
  query: PropTypes.object,
  cubejsApi: PropTypes.object,
  history: PropTypes.object.isRequired,
  chartLibrary: PropTypes.string.isRequired,
  setChartLibrary: PropTypes.func.isRequired,
  chartLibraries: PropTypes.array.isRequired
};

ChartContainer.defaultProps = {
  query: {},
  cubejsApi: null,
  hideActions: null,
  dashboardSource: null,
  codeSandboxSource: null,
  codeExample: null,
  error: null,
  resultSet: null
};

export default withRouter(ChartContainer);
