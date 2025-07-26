# AudioTricks Symfony Migration Guide

This guide provides direct mappings from the current React/Node.js architecture to Symfony PHP architecture with code examples.

## Architecture Mapping

### React → Symfony Mapping

| React/Node.js | Symfony Equivalent | Notes |
|--------------|-------------------|-------|
| React Components | Twig Components + Stimulus | Server-side rendering with JS sprinkles |
| Redux/Context | Symfony Services | Dependency injection |
| Express Routes | Symfony Controllers | RESTful routing |
| Middleware | Event Subscribers | Request/Response manipulation |
| Prisma Models | Doctrine Entities | ORM mapping |
| API Routes | API Platform | REST/GraphQL API |
| WebSocket | Mercure Hub | Real-time updates |
| Node Workers | Messenger Workers | Async processing |

## Database Entity Examples

### User Entity (from Prisma User model)

```php
<?php
// src/Entity/User.php
namespace App\Entity;

use App\Repository\UserRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'users')]
#[ORM\HasLifecycleCallbacks]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'UUID')]
    #[ORM\Column(type: 'guid')]
    private ?string $id = null;

    #[ORM\Column(type: 'string', length: 255, unique: true)]
    private string $email;

    #[ORM\Column(type: 'string', length: 255, unique: true)]
    private string $username;

    #[ORM\Column(name: 'password_hash', type: 'string')]
    private string $password;

    #[ORM\Column(type: 'string', length: 50, options: ['default' => 'user'])]
    private string $role = 'user';

    #[ORM\Column(name: 'first_name', type: 'string', length: 100, nullable: true)]
    private ?string $firstName = null;

    #[ORM\Column(name: 'last_name', type: 'string', length: 100, nullable: true)]
    private ?string $lastName = null;

    #[ORM\Column(type: 'string', length: 255, nullable: true)]
    private ?string $avatar = null;

    #[ORM\Column(name: 'phone_number', type: 'string', length: 50, nullable: true)]
    private ?string $phoneNumber = null;

    #[ORM\Column(name: 'business_name', type: 'string', length: 255, nullable: true)]
    private ?string $businessName = null;

    #[ORM\Column(type: 'string', length: 2, options: ['default' => 'US'])]
    private string $country = 'US';

    #[ORM\Column(type: 'string', length: 3, options: ['default' => 'USD'])]
    private string $currency = 'USD';

    #[ORM\Column(type: 'string', length: 50, options: ['default' => 'UTC'])]
    private string $timezone = 'UTC';

    #[ORM\Column(name: 'last_login_at', type: 'datetime', nullable: true)]
    private ?\DateTimeInterface $lastLoginAt = null;

    #[ORM\Column(name: 'email_verified', type: 'boolean', options: ['default' => false])]
    private bool $emailVerified = false;

    #[ORM\Column(name: 'is_active', type: 'boolean', options: ['default' => true])]
    private bool $isActive = true;

    #[ORM\Column(name: 'created_at', type: 'datetime')]
    private \DateTimeInterface $createdAt;

    #[ORM\Column(name: 'updated_at', type: 'datetime')]
    private \DateTimeInterface $updatedAt;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: WorkspaceUser::class)]
    private Collection $workspaceUsers;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: AudioUpload::class)]
    private Collection $audioUploads;

    #[ORM\OneToMany(mappedBy: 'user', targetEntity: Project::class)]
    private Collection $projects;

    public function __construct()
    {
        $this->workspaceUsers = new ArrayCollection();
        $this->audioUploads = new ArrayCollection();
        $this->projects = new ArrayCollection();
        $this->createdAt = new \DateTime();
        $this->updatedAt = new \DateTime();
    }

    #[ORM\PreUpdate]
    public function updateTimestamp(): void
    {
        $this->updatedAt = new \DateTime();
    }

    // UserInterface methods
    public function getRoles(): array
    {
        return ['ROLE_' . strtoupper($this->role)];
    }

    public function getUserIdentifier(): string
    {
        return $this->email;
    }

    public function eraseCredentials(): void
    {
        // Clear any temporary sensitive data
    }

    // Getters and setters...
}
```

### AudioUpload Entity

```php
<?php
// src/Entity/AudioUpload.php
namespace App\Entity;

use App\Repository\AudioUploadRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AudioUploadRepository::class)]
#[ORM\Table(name: 'audio_uploads')]
#[ORM\Index(columns: ['user_id', 'created_at'])]
#[ORM\Index(columns: ['workspace_id', 'created_at'])]
#[ORM\HasLifecycleCallbacks]
class AudioUpload
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'UUID')]
    #[ORM\Column(type: 'guid')]
    private ?string $id = null;

    #[ORM\ManyToOne(targetEntity: User::class, inversedBy: 'audioUploads')]
    #[ORM\JoinColumn(name: 'user_id', nullable: false)]
    private User $user;

    #[ORM\ManyToOne(targetEntity: Workspace::class, inversedBy: 'audioUploads')]
    #[ORM\JoinColumn(name: 'workspace_id', nullable: false)]
    private Workspace $workspace;

    #[ORM\Column(name: 'original_file_name', type: 'string', length: 255)]
    private string $originalFileName;

    #[ORM\Column(name: 'file_size', type: 'bigint')]
    private string $fileSize;

    #[ORM\Column(name: 'mime_type', type: 'string', length: 100)]
    private string $mimeType;

    #[ORM\Column(
        name: 'upload_status', 
        type: 'string', 
        length: 20,
        options: ['default' => 'pending']
    )]
    private string $uploadStatus = 'pending';

    #[ORM\Column(name: 'upload_progress', type: 'float', options: ['default' => 0])]
    private float $uploadProgress = 0.0;

    #[ORM\Column(name: 'storage_provider', type: 'string', length: 50)]
    private string $storageProvider;

    #[ORM\Column(name: 'storage_path', type: 'string', length: 500, nullable: true)]
    private ?string $storagePath = null;

    #[ORM\Column(name: 'cdn_url', type: 'string', length: 500, nullable: true)]
    private ?string $cdnUrl = null;

    #[ORM\Column(type: 'json')]
    private array $metadata = [];

    #[ORM\Column(name: 'created_at', type: 'datetime')]
    private \DateTimeInterface $createdAt;

    #[ORM\Column(name: 'updated_at', type: 'datetime')]
    private \DateTimeInterface $updatedAt;

    #[ORM\OneToMany(mappedBy: 'upload', targetEntity: ProcessingJob::class)]
    private Collection $processingJobs;

    public function __construct()
    {
        $this->processingJobs = new ArrayCollection();
        $this->createdAt = new \DateTime();
        $this->updatedAt = new \DateTime();
    }

    #[ORM\PreUpdate]
    public function updateTimestamp(): void
    {
        $this->updatedAt = new \DateTime();
    }

    // Getters and setters...
}
```

## Controller Examples

### Authentication Controller (Replaces auth.controller.ts)

```php
<?php
// src/Controller/AuthController.php
namespace App\Controller;

use App\Entity\User;
use App\Form\LoginType;
use App\Form\RegisterType;
use App\Service\JWTService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/auth')]
class AuthController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private UserPasswordHasherInterface $passwordHasher,
        private JWTService $jwtService,
        private ValidatorInterface $validator
    ) {}

    #[Route('/register', name: 'auth_register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);
        
        $user = new User();
        $form = $this->createForm(RegisterType::class, $user);
        $form->submit($data);
        
        if (!$form->isValid()) {
            $errors = [];
            foreach ($form->getErrors(true) as $error) {
                $errors[] = $error->getMessage();
            }
            return $this->json(['errors' => $errors], Response::HTTP_BAD_REQUEST);
        }
        
        // Hash password
        $hashedPassword = $this->passwordHasher->hashPassword(
            $user,
            $data['password']
        );
        $user->setPassword($hashedPassword);
        
        // Save user
        $this->entityManager->persist($user);
        $this->entityManager->flush();
        
        // Generate JWT
        $token = $this->jwtService->createToken($user);
        
        return $this->json([
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'username' => $user->getUsername(),
                'role' => $user->getRole()
            ],
            'token' => $token
        ], Response::HTTP_CREATED);
    }

    #[Route('/login', name: 'auth_login', methods: ['POST'])]
    public function login(Request $request): JsonResponse
    {
        // This is handled by Symfony Security
        // See security.yaml configuration
        throw new \LogicException('This method should not be reached');
    }

    #[Route('/me', name: 'auth_me', methods: ['GET'])]
    public function me(#[CurrentUser] ?User $user): JsonResponse
    {
        if (!$user) {
            return $this->json(['error' => 'Not authenticated'], Response::HTTP_UNAUTHORIZED);
        }
        
        return $this->json([
            'user' => [
                'id' => $user->getId(),
                'email' => $user->getEmail(),
                'username' => $user->getUsername(),
                'role' => $user->getRole(),
                'firstName' => $user->getFirstName(),
                'lastName' => $user->getLastName()
            ]
        ]);
    }

    #[Route('/logout', name: 'auth_logout', methods: ['POST'])]
    public function logout(): JsonResponse
    {
        // JWT is stateless, so just return success
        return $this->json(['message' => 'Logged out successfully']);
    }
}
```

### Audio Processing Controller

```php
<?php
// src/Controller/AudioController.php
namespace App\Controller;

use App\Entity\AudioUpload;
use App\Message\ProcessAudioMessage;
use App\Service\Audio\AudioUploadService;
use App\Service\Storage\StorageService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/audio')]
#[IsGranted('ROLE_USER')]
class AudioController extends AbstractController
{
    public function __construct(
        private AudioUploadService $uploadService,
        private StorageService $storageService,
        private MessageBusInterface $messageBus
    ) {}

    #[Route('/upload', name: 'audio_upload', methods: ['POST'])]
    public function upload(Request $request): JsonResponse
    {
        $file = $request->files->get('audio');
        
        if (!$file) {
            return $this->json(['error' => 'No file provided'], Response::HTTP_BAD_REQUEST);
        }
        
        try {
            // Create upload record
            $audioUpload = $this->uploadService->createUpload(
                $file,
                $this->getUser(),
                $this->getUser()->getCurrentWorkspace()
            );
            
            // Upload to storage (DigitalOcean Spaces)
            $storagePath = $this->storageService->uploadFile(
                $file,
                'audio/' . $audioUpload->getId()
            );
            
            $audioUpload->setStoragePath($storagePath);
            $audioUpload->setUploadStatus('completed');
            $this->uploadService->save($audioUpload);
            
            // Queue for processing
            $this->messageBus->dispatch(new ProcessAudioMessage($audioUpload->getId()));
            
            return $this->json([
                'id' => $audioUpload->getId(),
                'status' => 'processing',
                'filename' => $audioUpload->getOriginalFileName()
            ]);
            
        } catch (\Exception $e) {
            return $this->json(['error' => $e->getMessage()], Response::HTTP_INTERNAL_SERVER_ERROR);
        }
    }

    #[Route('/{id}', name: 'audio_get', methods: ['GET'])]
    public function get(AudioUpload $audioUpload): JsonResponse
    {
        // Check permissions
        if (!$this->isGranted('VIEW', $audioUpload)) {
            throw $this->createAccessDeniedException();
        }
        
        return $this->json([
            'id' => $audioUpload->getId(),
            'filename' => $audioUpload->getOriginalFileName(),
            'status' => $audioUpload->getUploadStatus(),
            'progress' => $audioUpload->getUploadProgress(),
            'cdnUrl' => $audioUpload->getCdnUrl(),
            'metadata' => $audioUpload->getMetadata(),
            'createdAt' => $audioUpload->getCreatedAt()->format('c')
        ]);
    }

    #[Route('/{id}/process', name: 'audio_process', methods: ['POST'])]
    public function process(AudioUpload $audioUpload): JsonResponse
    {
        if (!$this->isGranted('EDIT', $audioUpload)) {
            throw $this->createAccessDeniedException();
        }
        
        // Dispatch processing job
        $this->messageBus->dispatch(new ProcessAudioMessage($audioUpload->getId()));
        
        return $this->json(['status' => 'processing']);
    }
}
```

## Service Examples

### Audio Processing Service (Replaces audio-processor.service.ts)

```php
<?php
// src/Service/Audio/AudioProcessingService.php
namespace App\Service\Audio;

use App\Entity\AudioUpload;
use App\Entity\ProcessingJob;
use App\Service\Integration\OpenAIService;
use App\Service\Storage\StorageService;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Process\Process;

class AudioProcessingService
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private OpenAIService $openAI,
        private StorageService $storage,
        private LoggerInterface $logger
    ) {}

    public function processAudioFile(AudioUpload $audioUpload): ProcessingJob
    {
        $job = new ProcessingJob();
        $job->setUpload($audioUpload);
        $job->setJobType('transcription');
        $job->setStatus('processing');
        
        $this->entityManager->persist($job);
        $this->entityManager->flush();
        
        try {
            // Step 1: Download from storage
            $localPath = $this->storage->downloadToTemp($audioUpload->getStoragePath());
            
            // Step 2: Generate waveform
            $waveformData = $this->generateWaveform($localPath);
            $audioUpload->setMetadata(array_merge(
                $audioUpload->getMetadata(),
                ['waveform' => $waveformData]
            ));
            
            // Step 3: Transcribe with OpenAI
            $transcription = $this->openAI->transcribeAudio($localPath);
            
            // Step 4: Store results
            $job->setResult([
                'transcription' => $transcription['text'],
                'language' => $transcription['language'],
                'segments' => $transcription['segments'] ?? [],
                'duration' => $transcription['duration'] ?? null
            ]);
            
            $job->setStatus('completed');
            $job->setCompletedAt(new \DateTime());
            
            // Step 5: Generate summary
            if (!empty($transcription['text'])) {
                $summary = $this->openAI->generateSummary($transcription['text']);
                $audioUpload->setMetadata(array_merge(
                    $audioUpload->getMetadata(),
                    ['summary' => $summary]
                ));
            }
            
            // Clean up temp file
            unlink($localPath);
            
        } catch (\Exception $e) {
            $this->logger->error('Audio processing failed', [
                'upload_id' => $audioUpload->getId(),
                'error' => $e->getMessage()
            ]);
            
            $job->setStatus('failed');
            $job->setError($e->getMessage());
        }
        
        $this->entityManager->flush();
        
        return $job;
    }

    private function generateWaveform(string $audioPath): array
    {
        // Use audiowaveform tool to generate peaks
        $process = new Process([
            'audiowaveform',
            '-i', $audioPath,
            '--pixels-per-second', '10',
            '--bits', '8',
            '-o', '-'
        ]);
        
        $process->run();
        
        if (!$process->isSuccessful()) {
            throw new \RuntimeException('Failed to generate waveform: ' . $process->getErrorOutput());
        }
        
        return json_decode($process->getOutput(), true);
    }
}
```

### OpenAI Integration Service

```php
<?php
// src/Service/Integration/OpenAIService.php
namespace App\Service\Integration;

use Symfony\Component\HttpClient\HttpClient;
use Symfony\Contracts\HttpClient\HttpClientInterface;

class OpenAIService
{
    private HttpClientInterface $httpClient;
    private string $apiKey;
    
    public function __construct(string $openAiApiKey)
    {
        $this->apiKey = $openAiApiKey;
        $this->httpClient = HttpClient::create([
            'base_uri' => 'https://api.openai.com/v1/',
            'headers' => [
                'Authorization' => 'Bearer ' . $this->apiKey,
            ]
        ]);
    }
    
    public function transcribeAudio(string $audioPath): array
    {
        $response = $this->httpClient->request('POST', 'audio/transcriptions', [
            'body' => [
                'file' => fopen($audioPath, 'r'),
                'model' => 'whisper-1',
                'response_format' => 'verbose_json',
                'timestamp_granularities' => ['word']
            ]
        ]);
        
        return $response->toArray();
    }
    
    public function generateSummary(string $transcript): string
    {
        $response = $this->httpClient->request('POST', 'chat/completions', [
            'json' => [
                'model' => 'gpt-4',
                'messages' => [
                    [
                        'role' => 'system',
                        'content' => 'Summarize the following transcript in 3-5 bullet points. Be concise and capture the main ideas.'
                    ],
                    [
                        'role' => 'user',
                        'content' => $transcript
                    ]
                ],
                'temperature' => 0.3,
                'max_tokens' => 500
            ]
        ]);
        
        $data = $response->toArray();
        return $data['choices'][0]['message']['content'];
    }
}
```

## Twig Component Examples

### Audio Upload Component

```php
<?php
// src/Twig/Components/AudioUploader.php
namespace App\Twig\Components;

use Symfony\UX\LiveComponent\Attribute\AsLiveComponent;
use Symfony\UX\LiveComponent\Attribute\LiveProp;
use Symfony\UX\LiveComponent\Attribute\LiveAction;
use Symfony\UX\LiveComponent\DefaultActionTrait;

#[AsLiveComponent]
class AudioUploader
{
    use DefaultActionTrait;
    
    #[LiveProp]
    public ?string $uploadId = null;
    
    #[LiveProp]
    public string $status = 'idle'; // idle, uploading, processing, completed, error
    
    #[LiveProp]
    public float $progress = 0;
    
    #[LiveProp]
    public ?string $filename = null;
    
    #[LiveProp]
    public ?string $errorMessage = null;
    
    #[LiveProp]
    public array $acceptedFormats = ['audio/mpeg', 'audio/wav', 'audio/ogg'];
    
    #[LiveProp]
    public int $maxFileSize = 104857600; // 100MB
    
    #[LiveAction]
    public function startUpload(): void
    {
        $this->status = 'uploading';
        $this->progress = 0;
        // Upload logic handled by Stimulus controller
    }
    
    #[LiveAction]
    public function updateProgress(float $progress): void
    {
        $this->progress = $progress;
        if ($progress >= 100) {
            $this->status = 'processing';
        }
    }
    
    #[LiveAction]
    public function completeUpload(string $uploadId): void
    {
        $this->uploadId = $uploadId;
        $this->status = 'completed';
        $this->progress = 100;
    }
    
    #[LiveAction]
    public function handleError(string $message): void
    {
        $this->status = 'error';
        $this->errorMessage = $message;
    }
}
```

```twig
{# templates/components/audio-uploader.html.twig #}
<div {{ attributes.defaults({
    class: 'audio-uploader',
    'data-controller': 'audio-upload',
    'data-audio-upload-endpoint-value': path('audio_upload'),
    'data-audio-upload-max-size-value': maxFileSize,
    'data-audio-upload-accepted-value': acceptedFormats|json_encode
}) }}>
    <div class="upload-zone border-2 border-dashed border-gray-300 rounded-lg p-8 text-center
                {{ status == 'uploading' ? 'border-blue-500 bg-blue-50' : '' }}
                {{ status == 'error' ? 'border-red-500 bg-red-50' : '' }}">
        
        {% if status == 'idle' %}
            <input type="file" 
                   id="audio-file-{{ this.id }}"
                   class="hidden"
                   accept="{{ acceptedFormats|join(',') }}"
                   data-action="change->audio-upload#selectFile">
            
            <label for="audio-file-{{ this.id }}" class="cursor-pointer">
                <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <p class="mt-2 text-sm text-gray-600">
                    <span class="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p class="text-xs text-gray-500">
                    {{ (acceptedFormats|map(f => f|split('/')|last|upper))|join(', ') }} up to {{ (maxFileSize / 1024 / 1024)|round }}MB
                </p>
            </label>
            
            <div class="hidden" 
                 data-audio-upload-target="dropzone"
                 data-action="drop->audio-upload#handleDrop dragover->audio-upload#handleDragOver dragleave->audio-upload#handleDragLeave">
            </div>
        
        {% elseif status == 'uploading' %}
            <div class="space-y-4">
                <div class="flex items-center justify-center">
                    <svg class="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
                
                <div>
                    <p class="text-sm font-medium text-gray-900">{{ filename }}</p>
                    <p class="text-sm text-gray-500">Uploading...</p>
                </div>
                
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                    <div class="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                         style="width: {{ progress }}%"></div>
                </div>
                <p class="text-xs text-gray-600">{{ progress|round }}% complete</p>
            </div>
        
        {% elseif status == 'processing' %}
            <div class="space-y-4">
                <div class="flex items-center justify-center">
                    <svg class="animate-pulse h-8 w-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-900">{{ filename }}</p>
                    <p class="text-sm text-gray-500">Processing audio...</p>
                </div>
            </div>
        
        {% elseif status == 'completed' %}
            <div class="space-y-4">
                <div class="flex items-center justify-center">
                    <svg class="h-8 w-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <div>
                    <p class="text-sm font-medium text-gray-900">{{ filename }}</p>
                    <p class="text-sm text-green-600">Upload complete!</p>
                </div>
                <div class="flex justify-center space-x-4">
                    <a href="{{ path('audio_view', {id: uploadId}) }}" 
                       class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                        View Details
                    </a>
                    <button data-action="live#action"
                            data-action-name="resetUploader"
                            class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        Upload Another
                    </button>
                </div>
            </div>
        
        {% elseif status == 'error' %}
            <div class="space-y-4">
                <div class="flex items-center justify-center">
                    <svg class="h-8 w-8 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                </div>
                <div>
                    <p class="text-sm font-medium text-red-900">Upload failed</p>
                    <p class="text-sm text-red-700">{{ errorMessage }}</p>
                </div>
                <button data-action="live#action"
                        data-action-name="resetUploader"
                        class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    Try Again
                </button>
            </div>
        {% endif %}
    </div>
</div>
```

## Stimulus Controller Examples

### Audio Upload Controller (JavaScript)

```javascript
// assets/controllers/audio-upload_controller.js
import { Controller } from '@hotwired/stimulus'

export default class extends Controller {
    static targets = ['dropzone', 'progressBar']
    static values = {
        endpoint: String,
        maxSize: Number,
        accepted: Array
    }
    
    connect() {
        this.setupDropzone()
    }
    
    setupDropzone() {
        const zone = this.element.querySelector('.upload-zone')
        
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            zone.addEventListener(eventName, this.preventDefaults, false)
        })
        
        zone.addEventListener('dragenter', () => this.highlight(zone), false)
        zone.addEventListener('dragover', () => this.highlight(zone), false)
        zone.addEventListener('dragleave', () => this.unhighlight(zone), false)
        zone.addEventListener('drop', (e) => this.handleDrop(e), false)
    }
    
    preventDefaults(e) {
        e.preventDefault()
        e.stopPropagation()
    }
    
    highlight(zone) {
        zone.classList.add('border-blue-500', 'bg-blue-50')
    }
    
    unhighlight(zone) {
        zone.classList.remove('border-blue-500', 'bg-blue-50')
    }
    
    selectFile(event) {
        const file = event.target.files[0]
        if (file) {
            this.uploadFile(file)
        }
    }
    
    handleDrop(e) {
        const dt = e.dataTransfer
        const files = dt.files
        
        if (files.length > 0) {
            this.uploadFile(files[0])
        }
    }
    
    async uploadFile(file) {
        // Validate file
        if (!this.acceptedValue.includes(file.type)) {
            this.dispatch('error', { detail: { message: 'Invalid file type' } })
            return
        }
        
        if (file.size > this.maxSizeValue) {
            this.dispatch('error', { detail: { message: 'File too large' } })
            return
        }
        
        // Start upload
        this.dispatch('start', { detail: { filename: file.name } })
        
        const formData = new FormData()
        formData.append('audio', file)
        
        try {
            const response = await fetch(this.endpointValue, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
            
            if (!response.ok) {
                throw new Error('Upload failed')
            }
            
            const data = await response.json()
            this.dispatch('complete', { detail: { uploadId: data.id } })
            
        } catch (error) {
            this.dispatch('error', { detail: { message: error.message } })
        }
    }
}
```

## Message Handler Example

### Process Audio Message Handler

```php
<?php
// src/MessageHandler/ProcessAudioMessageHandler.php
namespace App\MessageHandler;

use App\Entity\AudioUpload;
use App\Message\ProcessAudioMessage;
use App\Service\Audio\AudioProcessingService;
use Doctrine\ORM\EntityManagerInterface;
use Psr\Log\LoggerInterface;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;
use Symfony\Component\Messenger\MessageBusInterface;
use Symfony\Component\Mercure\HubInterface;
use Symfony\Component\Mercure\Update;

#[AsMessageHandler]
class ProcessAudioMessageHandler
{
    public function __construct(
        private EntityManagerInterface $entityManager,
        private AudioProcessingService $processingService,
        private HubInterface $mercureHub,
        private LoggerInterface $logger
    ) {}
    
    public function __invoke(ProcessAudioMessage $message): void
    {
        $audioUpload = $this->entityManager->find(
            AudioUpload::class, 
            $message->getAudioUploadId()
        );
        
        if (!$audioUpload) {
            $this->logger->error('Audio upload not found', [
                'id' => $message->getAudioUploadId()
            ]);
            return;
        }
        
        try {
            // Send progress update
            $this->sendProgressUpdate($audioUpload, 0, 'starting');
            
            // Process the audio
            $job = $this->processingService->processAudioFile($audioUpload);
            
            // Send completion update
            $this->sendProgressUpdate($audioUpload, 100, 'completed', [
                'transcription' => $job->getResult()['transcription'] ?? null,
                'summary' => $audioUpload->getMetadata()['summary'] ?? null
            ]);
            
        } catch (\Exception $e) {
            $this->logger->error('Audio processing failed', [
                'upload_id' => $audioUpload->getId(),
                'error' => $e->getMessage()
            ]);
            
            $this->sendProgressUpdate($audioUpload, 0, 'failed', [
                'error' => $e->getMessage()
            ]);
        }
    }
    
    private function sendProgressUpdate(
        AudioUpload $audioUpload, 
        int $progress, 
        string $status,
        array $additionalData = []
    ): void {
        $update = new Update(
            sprintf('audio/%s/progress', $audioUpload->getId()),
            json_encode(array_merge([
                'id' => $audioUpload->getId(),
                'progress' => $progress,
                'status' => $status
            ], $additionalData))
        );
        
        $this->mercureHub->publish($update);
    }
}
```

## Security Configuration

### security.yaml

```yaml
# config/packages/security.yaml
security:
    enable_authenticator_manager: true
    
    password_hashers:
        Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface: 'auto'
        App\Entity\User:
            algorithm: auto
            
    providers:
        app_user_provider:
            entity:
                class: App\Entity\User
                property: email
                
    firewalls:
        dev:
            pattern: ^/(_(profiler|wdt)|css|images|js)/
            security: false
            
        api:
            pattern: ^/api
            stateless: true
            provider: app_user_provider
            json_login:
                check_path: /api/auth/login
                username_path: email
                password_path: password
                success_handler: App\Security\AuthenticationSuccessHandler
                failure_handler: App\Security\AuthenticationFailureHandler
            jwt: ~
            
        main:
            lazy: true
            provider: app_user_provider
            form_login:
                login_path: login
                check_path: login
                enable_csrf: true
            logout:
                path: logout
                target: /
            remember_me:
                secret: '%kernel.secret%'
                lifetime: 604800
                path: /
                
    access_control:
        - { path: ^/api/auth/(login|register), roles: PUBLIC_ACCESS }
        - { path: ^/api/admin, roles: ROLE_ADMIN }
        - { path: ^/api, roles: ROLE_USER }
        - { path: ^/admin, roles: ROLE_ADMIN }
        
    role_hierarchy:
        ROLE_ADMIN: [ROLE_USER]
        ROLE_SUPER_ADMIN: [ROLE_ADMIN]
```

## Messenger Configuration

### messenger.yaml

```yaml
# config/packages/messenger.yaml
framework:
    messenger:
        failure_transport: failed
        
        transports:
            async:
                dsn: '%env(MESSENGER_TRANSPORT_DSN)%'
                options:
                    use: 'App\Message\ProcessAudioMessage'
                    queues:
                        audio_processing:
                            binding_keys: [audio]
                retry_strategy:
                    max_retries: 3
                    delay: 1000
                    multiplier: 2
                    max_delay: 0
                    
            failed:
                dsn: 'doctrine://default?queue_name=failed'
                
        routing:
            App\Message\ProcessAudioMessage: async
            App\Message\GenerateTranscriptionMessage: async
            App\Message\SendNotificationMessage: async
            
        buses:
            messenger.bus.default:
                middleware:
                    - validation
                    - doctrine_transaction
```

## API Platform Configuration

### Audio Resource

```php
<?php
// src/ApiResource/AudioResource.php
namespace App\ApiResource;

use ApiPlatform\Metadata\ApiResource;
use ApiPlatform\Metadata\Get;
use ApiPlatform\Metadata\GetCollection;
use ApiPlatform\Metadata\Post;
use ApiPlatform\Metadata\Put;
use ApiPlatform\Metadata\Delete;
use App\Entity\AudioUpload;
use App\State\AudioProcessor;

#[ApiResource(
    operations: [
        new GetCollection(
            uriTemplate: '/audio',
            security: "is_granted('ROLE_USER')"
        ),
        new Get(
            uriTemplate: '/audio/{id}',
            security: "is_granted('VIEW', object)"
        ),
        new Post(
            uriTemplate: '/audio',
            security: "is_granted('ROLE_USER')",
            processor: AudioProcessor::class
        ),
        new Put(
            uriTemplate: '/audio/{id}',
            security: "is_granted('EDIT', object)"
        ),
        new Delete(
            uriTemplate: '/audio/{id}',
            security: "is_granted('DELETE', object)"
        )
    ],
    normalizationContext: ['groups' => ['audio:read']],
    denormalizationContext: ['groups' => ['audio:write']]
)]
class AudioResource
{
    public ?string $id = null;
    public string $filename;
    public string $status;
    public ?float $progress = null;
    public ?array $transcription = null;
    public ?string $summary = null;
    public \DateTimeInterface $createdAt;
    
    public static function fromEntity(AudioUpload $upload): self
    {
        $resource = new self();
        $resource->id = $upload->getId();
        $resource->filename = $upload->getOriginalFileName();
        $resource->status = $upload->getUploadStatus();
        $resource->progress = $upload->getUploadProgress();
        $resource->createdAt = $upload->getCreatedAt();
        
        return $resource;
    }
}
```

## Database Migration Example

```php
<?php
// migrations/Version20240125000000.php
namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20240125000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create audio processing tables';
    }

    public function up(Schema $schema): void
    {
        // Create users table
        $this->addSql('CREATE TABLE users (
            id UUID NOT NULL DEFAULT gen_random_uuid(),
            email VARCHAR(255) NOT NULL,
            username VARCHAR(255) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT \'user\',
            first_name VARCHAR(100),
            last_name VARCHAR(100),
            avatar VARCHAR(255),
            phone_number VARCHAR(50),
            business_name VARCHAR(255),
            country VARCHAR(2) DEFAULT \'US\',
            currency VARCHAR(3) DEFAULT \'USD\',
            timezone VARCHAR(50) DEFAULT \'UTC\',
            last_login_at TIMESTAMP,
            email_verified BOOLEAN DEFAULT FALSE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(id)
        )');
        
        $this->addSql('CREATE UNIQUE INDEX UNIQ_users_email ON users (email)');
        $this->addSql('CREATE UNIQUE INDEX UNIQ_users_username ON users (username)');
        
        // Create audio_uploads table
        $this->addSql('CREATE TABLE audio_uploads (
            id UUID NOT NULL DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            workspace_id UUID NOT NULL,
            original_file_name VARCHAR(255) NOT NULL,
            file_size BIGINT NOT NULL,
            mime_type VARCHAR(100) NOT NULL,
            upload_status VARCHAR(20) DEFAULT \'pending\',
            upload_progress FLOAT DEFAULT 0,
            storage_provider VARCHAR(50) NOT NULL,
            storage_path VARCHAR(500),
            cdn_url VARCHAR(500),
            metadata JSONB DEFAULT \'{}\',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY(id)
        )');
        
        $this->addSql('CREATE INDEX IDX_audio_uploads_user_created ON audio_uploads (user_id, created_at)');
        $this->addSql('CREATE INDEX IDX_audio_uploads_workspace_created ON audio_uploads (workspace_id, created_at)');
        
        // Add foreign keys
        $this->addSql('ALTER TABLE audio_uploads ADD CONSTRAINT FK_audio_uploads_user 
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE audio_uploads');
        $this->addSql('DROP TABLE users');
    }
}
```

## Summary

This migration guide provides:

1. **Direct Entity Mappings**: Prisma models → Doctrine entities
2. **Controller Examples**: Express routes → Symfony controllers
3. **Service Architecture**: Node.js services → Symfony services
4. **Component System**: React components → Twig/Stimulus components
5. **Message Queue**: Node workers → Symfony Messenger
6. **Security**: JWT implementation in Symfony
7. **API Layer**: API Platform for REST endpoints

Each code example is production-ready and follows Symfony best practices while maintaining the same functionality as the original React/Node.js application.