import React, { useEffect, useState } from 'react';
import collaborationService from '../../services/collaborationService';
import { toast } from 'react-hot-toast';

const UserList = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const usersPerPage = 5;

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const response = await collaborationService.getAllUsers();
        setAllUsers(response.users);
      } catch (error) {
        toast.error(`Failed to load users: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = allUsers.filter(user => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDomain = domainFilter
      ? user.email.toLowerCase().includes(domainFilter.toLowerCase())
      : true;

    return matchesSearch && matchesDomain;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * usersPerPage,
    currentPage * usersPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl font-bold mb-4">Registered Users</h2>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search by name or email"
          className="input input-bordered w-full md:w-1/2 bg-base-100 text-base-content"
        />
        <input
          type="text"
          value={domainFilter}
          onChange={(e) => {
            setDomainFilter(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Filter by domain (e.g. @gmail.com)"
          className="input input-bordered w-full md:w-1/2 bg-base-100 text-base-content"
        />
      </div>

      {/* Table */}
      {/* Table */}
<div className="overflow-x-auto">
  <p className="text-sm text-center text-base-content mb-2">
    Showing page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span> — displaying <span className="font-medium">{paginatedUsers.length}</span> user{paginatedUsers.length !== 1 && 's'}
  </p>

  <table className="table table-zebra w-full bg-base-200 text-base-content">
    <thead className="sticky top-0 bg-base-200 z-10">
      <tr>
        <th>Name</th>
        <th>Email</th>
      </tr>
    </thead>
    <tbody>
      {isLoading ? (
        <tr>
          <td colSpan="2">
            <span className="loading loading-spinner loading-md text-primary"></span>
          </td>
        </tr>
      ) : paginatedUsers.length === 0 ? (
        <tr>
          <td colSpan="2" className="text-center text-gray-500">No users found.</td>
        </tr>
      ) : (
        paginatedUsers.map(user => (
          <tr key={user._id}>
            <td>{user.fullName}</td>
            <td>{user.email}</td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</div>

{/* Pagination Controls */}
{totalPages > 1 && (
  <div className="mt-4 overflow-x-auto">
    <div className="flex gap-2 justify-center w-max mx-auto">
      {[...Array(totalPages)].map((_, index) => {
        const page = index + 1;
        return (
          <button
            key={page}
            onClick={() => handlePageChange(page)}
            className={`btn btn-sm ${currentPage === page ? 'btn-primary' : 'btn-outline'}`}
          >
            {page}
          </button>
        );
      })}
    </div>
  </div>
)}

    </div>
  );
};

export default UserList;
