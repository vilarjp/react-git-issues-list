import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

import api from '../../services/api';

import Container from '../../components/Container';
import { Loading, Owner, IssueList, Filter, Buttons } from './styles';

export default class Repository extends Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    repoName: '',
    filter: 'all',
    page: 1,
  };

  async componentDidMount() {
    const { match } = this.props;

    const repository = decodeURIComponent(match.params.repository);
    this.setState({ repoName: repository }, () => {
      const { repoName } = this.state;
      this.getRepo(repoName);
    });
  }

  getRepo = async repoName => {
    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`/repos/${repoName}/issues`, {
        params: {
          per_page: 5,
        },
      }),
    ]);

    this.setState({
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  };

  handleRepos = async (repoName, filter, page) => {
    const issues = await api.get(`/repos/${repoName}/issues`, {
      params: {
        state: filter,
        per_page: 5,
        page,
      },
    });

    this.setState({
      issues: issues.data,
    });
  };

  setFilter = event => {
    this.setState({ filter: event.target.value, page: 1 }, () => {
      const { repoName, filter, page } = this.state;
      this.handleRepos(repoName, filter, page);
    });
  };

  paginate = p => {
    if (p === 0) return;
    this.setState({ page: p }, () => {
      const { repoName, filter, page } = this.state;
      this.handleRepos(repoName, filter, page);
    });
  };

  render() {
    const { repository, issues, loading, filter } = this.state;
    const { page } = this.state;

    if (loading) {
      return <Loading>Loading...</Loading>;
    }
    return (
      <Container>
        <Owner>
          <Link to="/">Go back to repositories</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <Filter>
          <label htmlFor="filter">
            Filter
            <select id="filter" value={filter} onChange={this.setFilter}>
              <option value="all">all</option>
              <option value="open">open</option>
              <option value="closed">closed</option>
            </select>
          </label>
        </Filter>

        <IssueList>
          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a
                    href={issue.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {issue.title}
                  </a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>

        <Buttons>
          <button
            type="button"
            onClick={() => this.paginate(page - 1)}
            disabled={page === 1}
          >
            Previous page
          </button>
          <button type="button" onClick={() => this.paginate(page + 1)}>
            Next page
          </button>
        </Buttons>
      </Container>
    );
  }
}
