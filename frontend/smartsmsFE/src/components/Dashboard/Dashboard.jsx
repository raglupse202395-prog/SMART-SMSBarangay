  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // 1. Fetch residents safely
        let residentsCount = 0;
        try {
            const residentsResponse = await services.getResidents();
            residentsCount = Array.isArray(residentsResponse) ? residentsResponse.length : (residentsResponse?.data?.length || 0);
        } catch (e) { console.log("No residents yet"); }

        // 2. Fetch Broadcasts safely
        let broadcastData = [];
        try {
            const broadcastHistory = await services.getBroadcastHistory();
            broadcastData = Array.isArray(broadcastHistory) ? broadcastHistory : [];
        } catch (e) { console.log("No broadcasts yet"); }

        // 3. Fetch Requests safely
        let allRequests = [];
        let pendingRequests = 0;
        try {
            const requestsResponse = await services.getAllDocumentRequests();
            allRequests = requestsResponse?.requests || [];
            
            const pendingRequestsResponse = await services.getPendingDocumentRequests();
            pendingRequests = pendingRequestsResponse?.count || 0;
        } catch (e) { console.log("No requests yet"); }

        setStats({
          totalSMS: broadcastData.length,
          pendingRequests: pendingRequests,
          registeredResidents: residentsCount,
          announcements: broadcastData.length
        });

        setBroadcasts(
          broadcastData.slice(0, 3).map(broadcast => ({
            message: broadcast.message || 'No message',
            date: broadcast.createdAt ? new Date(broadcast.createdAt).toISOString().split('T')[0] : 'N/A',
            recipients: broadcast.phoneNumbers?.length || 0,
            category: broadcast.broadcastType || 'General'
          }))
        );

        setDocumentRequests(
          allRequests
            .filter(request => request.status === 'pending')
            .slice(0, 5)
            .map(request => ({
              name: request.fullName || 'Unknown',
              document: request.documentType || 'Unknown',
              status: request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1) : 'Unknown',
              date: request.createdAt ? new Date(request.createdAt).toISOString().split('T')[0] : 'N/A'
            }))
        );

        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);