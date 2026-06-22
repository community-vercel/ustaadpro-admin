'use client';

import {useEffect, useMemo, useState} from 'react';
import {RefreshCw, ShieldCheck, UserCheck} from 'lucide-react';
import {AdminShell} from '@/components/AdminShell';
import {
  ServiceProviderResource,
  getServiceProviderResources,
} from '@/lib/firebaseResources';

const pageSizeOptions = [12, 24, 48, 96];

function statusLabel(status: string) {
  return status
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(item => item.charAt(0).toUpperCase() + item.slice(1))
    .join(' ');
}

export default function ResourcesPage() {
  const [providers, setProviders] = useState<ServiceProviderResource[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [skillFilter, setSkillFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [onlineFilter, setOnlineFilter] = useState('all');
  const [pageSize, setPageSize] = useState(24);
  const [currentPage, setCurrentPage] = useState(1);

  const acceptedProviders = useMemo(
    () => providers.filter(item => item.accountStatus === 'accepted').length,
    [providers],
  );
  const onlineProviders = useMemo(
    () => providers.filter(item => item.isOnline).length,
    [providers],
  );
  const cityOptions = useMemo(
    () =>
      Array.from(new Set(providers.map(item => item.city).filter(Boolean))).sort(),
    [providers],
  );
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(providers.map(item => item.serviceCategory).filter(Boolean)),
      ).sort(),
    [providers],
  );
  const skillOptions = useMemo(
    () =>
      Array.from(
        new Set(providers.flatMap(item => item.subcategories).filter(Boolean)),
      ).sort(),
    [providers],
  );
  const statusOptions = useMemo(
    () =>
      Array.from(
        new Set(providers.map(item => item.accountStatus).filter(Boolean)),
      ).sort(),
    [providers],
  );
  const filteredProviders = useMemo(() => {
    const query = search.trim().toLowerCase();
    return providers.filter(provider => {
      const matchesSearch =
        !query ||
        [
          provider.name,
          provider.phone,
          provider.email,
          provider.city,
          provider.area,
          provider.address,
          provider.locationText,
          provider.serviceCategory,
          provider.serviceType,
          provider.uid,
          ...provider.subcategories,
        ]
          .filter(Boolean)
          .some(value => value.toLowerCase().includes(query));
      const matchesCity = cityFilter === 'all' || provider.city === cityFilter;
      const matchesCategory =
        categoryFilter === 'all' ||
        provider.serviceCategory === categoryFilter;
      const matchesSkill =
        skillFilter === 'all' || provider.subcategories.includes(skillFilter);
      const matchesStatus =
        statusFilter === 'all' || provider.accountStatus === statusFilter;
      const matchesOnline =
        onlineFilter === 'all' ||
        (onlineFilter === 'online' ? provider.isOnline : !provider.isOnline);

      return (
        matchesSearch &&
        matchesCity &&
        matchesCategory &&
        matchesSkill &&
        matchesStatus &&
        matchesOnline
      );
    });
  }, [
    categoryFilter,
    cityFilter,
    onlineFilter,
    providers,
    search,
    skillFilter,
    statusFilter,
  ]);
  const totalPages = Math.max(1, Math.ceil(filteredProviders.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const visibleProviders = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return filteredProviders.slice(start, start + pageSize);
  }, [filteredProviders, pageSize, safeCurrentPage]);
  const firstVisible = filteredProviders.length
    ? (safeCurrentPage - 1) * pageSize + 1
    : 0;
  const lastVisible = Math.min(
    safeCurrentPage * pageSize,
    filteredProviders.length,
  );

  const resetPagination = () => setCurrentPage(1);

  const loadData = async () => {
    setLoading(true);
    setMessage('');
    try {
      const nextProviders = await getServiceProviderResources();
      setProviders(nextProviders);
      setCurrentPage(1);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Could not load service providers.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  return (
    <AdminShell
      eyebrow="Service network"
      title="Our Resources"
      action={
        <button className="ghostButton" onClick={() => void loadData()}>
          <RefreshCw size={17} />
          Refresh
        </button>
      }
    >
      {message && <div className="notice">{message}</div>}

      <section className="statsGrid resourcesStats">
        <div className="statCard">
          <div className="statIcon">
            <UserCheck size={19} />
          </div>
          <span>Total Providers</span>
          <strong>{providers.length}</strong>
        </div>
        <div className="statCard">
          <div className="statIcon">
            <ShieldCheck size={19} />
          </div>
          <span>Accepted</span>
          <strong>{acceptedProviders}</strong>
        </div>
        <div className="statCard">
          <div className="statIcon">
            <RefreshCw size={19} />
          </div>
          <span>Online Now</span>
          <strong>{onlineProviders}</strong>
        </div>
      </section>

      <section className="panel">
        <div className="panelHead">
          <div>
            <p className="eyebrow">Registered providers</p>
            <h3>Service Providers</h3>
          </div>
          <span className="countPill">
            {loading
              ? 'Loading...'
              : `${firstVisible}-${lastVisible} of ${filteredProviders.length} matches`}
          </span>
        </div>

        <div className="resourceFilters">
          <label className="field">
            <span>Search by name, phone, city, category, or work</span>
            <input
              value={search}
              onChange={event => {
                setSearch(event.target.value);
                resetPagination();
              }}
              placeholder="Lahore, Electrician, Wiring..."
            />
          </label>
          <label className="field">
            <span>City</span>
            <select
              value={cityFilter}
              onChange={event => {
                setCityFilter(event.target.value);
                resetPagination();
              }}
            >
              <option value="all">All cities</option>
              {cityOptions.map(city => (
                <option value={city} key={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Service category</span>
            <select
              value={categoryFilter}
              onChange={event => {
                setCategoryFilter(event.target.value);
                resetPagination();
              }}
            >
              <option value="all">All categories</option>
              {categoryOptions.map(category => (
                <option value={category} key={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Skill</span>
            <select
              value={skillFilter}
              onChange={event => {
                setSkillFilter(event.target.value);
                resetPagination();
              }}
            >
              <option value="all">All skills</option>
              {skillOptions.map(skill => (
                <option value={skill} key={skill}>
                  {skill}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={event => {
                setStatusFilter(event.target.value);
                resetPagination();
              }}
            >
              <option value="all">All statuses</option>
              {statusOptions.map(status => (
                <option value={status} key={status}>
                  {statusLabel(status)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Online</span>
            <select
              value={onlineFilter}
              onChange={event => {
                setOnlineFilter(event.target.value);
                resetPagination();
              }}
            >
              <option value="all">All providers</option>
              <option value="online">Online only</option>
              <option value="offline">Offline only</option>
            </select>
          </label>
          <label className="field">
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={event => {
                setPageSize(Number(event.target.value));
                resetPagination();
              }}
            >
              {pageSizeOptions.map(option => (
                <option value={option} key={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        {filteredProviders.length ? (
          <div className="resourceGrid">
            {visibleProviders.map(provider => (
              <article className="resourceCard" key={provider.id}>
                <div className="resourceCardTop">
                  <div>
                    <p className="resourceRole">{provider.serviceType}</p>
                    <h4>{provider.name}</h4>
                  </div>
                  <span
                    className={`resourceStatus resourceStatus-${provider.accountStatus}`}
                  >
                    {statusLabel(provider.accountStatus)}
                  </span>
                </div>

                <div className="resourceMeta">
                  <span>{provider.serviceCategory}</span>
                  <span>{provider.city}</span>
                  {provider.area && <span>{provider.area}</span>}
                  <span>{provider.isOnline ? 'Online' : 'Offline'}</span>
                </div>

                <div className="resourceLocation">
                  <strong>Location</strong>
                  <span>
                    {provider.address ||
                      provider.locationText ||
                      [provider.area, provider.city].filter(Boolean).join(', ') ||
                      'City only'}
                  </span>
                  {provider.latitude !== null && provider.longitude !== null && (
                    <span>
                      Coordinates: {provider.latitude}, {provider.longitude}
                    </span>
                  )}
                </div>

                <div className="resourceContact">
                  <span>{provider.phone || 'No phone'}</span>
                  <span>{provider.email || 'No email'}</span>
                </div>

                <div className="resourceTags">
                  {provider.subcategories.length ? (
                    provider.subcategories.map(item => (
                      <span key={`${provider.id}-${item}`}>{item}</span>
                    ))
                  ) : (
                    <span>No subcategories</span>
                  )}
                </div>

                <div className="resourceFooter">
                  <span>UID: {provider.uid}</span>
                  <span>Last seen: {provider.lastSeen}</span>
                </div>

                <div className="resourceDocs">
                  <strong>Documents</strong>
                  <span>CNIC front: {provider.cnicFront || 'Not uploaded'}</span>
                  <span>CNIC back: {provider.cnicBack || 'Not uploaded'}</span>
                  <span>
                    Profile image: {provider.profileImage || 'Not uploaded'}
                  </span>
                  {provider.reason && <span>Reason: {provider.reason}</span>}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty">
            {loading
              ? 'Loading service providers...'
              : 'No providers match these filters.'}
          </div>
        )}

        {filteredProviders.length > 0 && (
          <div className="paginationBar">
            <span>
              Showing {firstVisible}-{lastVisible} of{' '}
              {filteredProviders.length} matching providers
            </span>
            <div className="paginationActions">
              <button
                className="ghostButton"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage(1)}
              >
                First
              </button>
              <button
                className="ghostButton"
                disabled={safeCurrentPage === 1}
                onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
              >
                Previous
              </button>
              <strong>
                Page {safeCurrentPage} of {totalPages}
              </strong>
              <button
                className="ghostButton"
                disabled={safeCurrentPage === totalPages}
                onClick={() =>
                  setCurrentPage(page => Math.min(totalPages, page + 1))
                }
              >
                Next
              </button>
              <button
                className="ghostButton"
                disabled={safeCurrentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
              >
                Last
              </button>
            </div>
          </div>
        )}
      </section>
    </AdminShell>
  );
}
