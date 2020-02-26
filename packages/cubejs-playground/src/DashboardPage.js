/* globals window */
import React, { Component } from 'react';
import {
  Spin, Button, Alert, Menu, Dropdown, Icon, Form
} from 'antd';
import { Link, withRouter, Redirect } from 'react-router-dom';
import DashboardSource from "./DashboardSource";
import fetch from './playgroundFetch';
import { frameworks } from "./ChartContainer";
import { playgroundAction } from "./events";
import { chartLibraries } from "./ChartRenderer";

const Frame = ({ children }) => (
  <div style={{ textAlign: 'center', marginTop: 50 }}>
    { children }
  </div>
);

const Hint = () => (
  <p style={{ width: 450, margin: "20px auto" }}>
    仪表盘便于设置和部署前端应用到后台. 你也可以通过文档来学习 <a href="https://cube.dev/docs/dashboard-app" target="_blankl">Cube.js docs</a>.
  </p>
);

class DashboardPage extends Component {
  constructor(props) {
    super(props);
    this.state = {
      chartLibrary: chartLibraries[0].value,
      framework: 'react',
      templatePackageName: 'react-antd-dynamic'
    };
  }

  async componentDidMount() {
    this.dashboardSource = new DashboardSource();
    await this.loadDashboard();
  }

  async loadDashboard() {
    this.setState({
      appCode: null,
      loadError: null
    });
    try {
      await this.dashboardSource.load();
      this.setState({
        dashboardStarting: false,
        appCode: !this.dashboardSource.loadError && this.dashboardSource.dashboardCreated,
        loadError: this.dashboardSource.loadError
      });
      const dashboardStatus = await (await fetch('/playground/dashboard-app-status')).json();
      this.setState({
        dashboardRunning: dashboardStatus.running,
        dashboardPort: dashboardStatus.dashboardPort,
        dashboardAppPath: dashboardStatus.dashboardAppPath
      });
    } catch (e) {
      this.setState({
        dashboardStarting: false,
        loadError: <pre>{e.toString()}</pre>
      });
      throw e;
    }
  }

  async startDashboardApp() {
    this.setState({
      dashboardStarting: true
    });
    await fetch('/playground/start-dashboard-app');
    await this.loadDashboard();
  }

  render() {
    const {
      appCode, dashboardPort, loadError, dashboardRunning, dashboardStarting, dashboardAppPath
    } = this.state;
    if (loadError && typeof loadError === 'string' && loadError.indexOf('Dashboard app not found') !== -1) {
      return <Redirect to="/template-gallery" />;
    }
    if (loadError) {
      return (
        <Frame>
          <h2>
            {loadError}
          </h2>
          <p style={{ marginTop: 25 }}>
            <Link to="/template-gallery">
              <Button
                type="primary"
              >
                在工程目录中创建仪表盘
              </Button>
            </Link>
          </p>
          <Hint />
        </Frame>
      );
    }
    if (!appCode) {
      return (
        <Frame>
          <h2>
            &nbsp; 正在创建仪表盘
          </h2>
          <p>
            <Spin tip="稍等片刻. 请检查控制台查看进度..." />
          </p>
          <Hint />
        </Frame>
      );
    }
    if (!dashboardRunning) {
      return (
        <Frame>
          <h2>
            仪表盘没有运行
          </h2>
          <h3>
            请启动仪表盘或者手动运行
            <code className="inline-code">$ npm run start</code>
            <br />
            in&nbsp;
            <b>{dashboardAppPath}</b>
            &nbsp;directory.
          </h3>
          <p style={{ marginTop: 25 }}>
            <Button
              type="primary"
              size="large"
              loading={dashboardStarting}
              onClick={() => this.startDashboardApp(true)}
            >
              {dashboardStarting ? 'Dashboard app is starting. It may take a while. Please check console for progress...' : '启动仪表盘应用'}
            </Button>
          </p>
          <Hint />
        </Frame>
      );
    }
    const devServerUrl = `http://${window.location.hostname}:${dashboardPort}`;
    return (
      <div
        style={{
          height: '100%', width: '100%', padding: "15px 30px 30px 30px", background: "#fff"
        }}
      >
        <Alert
          message={(
            <span>
              仪表盘应用可以编辑 &nbsp;
              <b>{dashboardAppPath}</b>
              .
              Dev server is running at&nbsp;
              <a href={devServerUrl} target="_blank" rel="noopener noreferrer">{devServerUrl}</a>
              .
              Learn more how to customize and deploy it at&nbsp;
              <a href="https://cube.dev/docs/dashboard-app">Cube.js&nbsp;docs</a>
              .&nbsp;
              <a onClick={() => window.location.reload()} style={{ cursor: 'pointer' }}>Refresh page</a>
              &nbsp;if it is empty.
            </span>
          )}
          type="info"
          closable
          style={{ marginBottom: 15 }}
        />
        <iframe
          src={devServerUrl}
          style={{
            width: '100%', height: '100%', border: 0, borderRadius: 4, overflow: 'hidden'
          }}
          sandbox="allow-modals allow-forms allow-popups allow-scripts allow-same-origin"
          title="仪表盘"
        />
      </div>
    );
  }
}

export default withRouter(DashboardPage);
