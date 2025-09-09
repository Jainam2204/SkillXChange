import { FaUser, FaEnvelope, FaCreditCard, FaEye, FaVideo } from "react-icons/fa";

const Sidebar = ({loggedInUserId}) => {
  return (
    <div className="fixed left-0 top-14 w-64 h-screen bg-blue-500 p-4 flex flex-col shadow-md">
      {/* <div className="bg-green-500 text-white p-3 rounded-md text-center font-bold">
      {loggedInUserId}
      </div> */}

      <nav className="mt-4 space-y-2">
        <button className="flex items-center space-x-3 p-2 w-full text-left hover:bg-gray-300 rounded-md">
          <FaUser />
          <span>Your Profile</span>
        </button>
        <button className="flex items-center space-x-3 p-2 w-full text-left hover:bg-gray-300 rounded-md">
          <FaEnvelope />
          <span>Messages</span>
        </button>
        <button className="flex items-center space-x-3 p-2 w-full text-left hover:bg-gray-300 rounded-md">
          <FaCreditCard />
          <span>Subscription</span>
        </button>
        <button className="flex items-center space-x-3 p-2 w-full text-left hover:bg-gray-300 rounded-md">
          <FaEye />
          <span>View Profiles</span>
        </button>
        <button className="flex items-center space-x-3 p-2 w-full text-left hover:bg-gray-300 rounded-md">
          <FaVideo />
          <span>Meet</span>
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;