import 'api_client.dart';
import 'offline_queue.dart';
import 'session.dart';
import '../services/driver_services.dart';
import '../finance/repository.dart';
import '../maintenance/repository.dart';

/// Componentes compartilhados, inicializados em main() após carregar a sessão.
late final SessionStore session;
late final ApiClient api;
late final OfflineQueue offlineQueue;

late final AuthService authService;
late final ScheduleService scheduleService;
late final ChecklistService checklistService;
late final WorkOrderService workOrderService;
late final FineService fineService;
late final PointService pointService;
late final EmployeePortalService portalService;
late final MessageService messageService;
late final BoardingService boardingService;
late final RouteCodeService routeCodeService;
late final ParteDiariaService parteDiariaService;
late final FinanceRepository financeRepository;
late final MaintenanceRepository maintenanceRepository;

Future<void> initLocator() async {
  session = SessionStore();
  await session.load();
  api = ApiClient(session);
  offlineQueue = OfflineQueue(api);
  authService = AuthService(api);
  scheduleService = ScheduleService(api);
  checklistService = ChecklistService(api);
  workOrderService = WorkOrderService(api);
  fineService = FineService(api);
  pointService = PointService(api);
  portalService = EmployeePortalService(api);
  messageService = MessageService(api);
  boardingService = BoardingService(api);
  routeCodeService = RouteCodeService(api);
  parteDiariaService = ParteDiariaService(api);
  financeRepository = FinanceRepository(api);
  maintenanceRepository = MaintenanceRepository(api);
}
